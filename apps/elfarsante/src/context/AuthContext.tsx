import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import {
	auth,
	collection,
	db,
	doc,
	getDoc,
	getDocs,
	initAuth,
	onAuthStateChanged,
	onSnapshot,
	query,
	serverTimestamp,
	setDoc,
	type User,
	updateDoc,
	where,
} from '@/firebase';

export interface LinkRequest {
	id: string;
	targetUid: string;
	requesterSessionId: string;
	status: 'pending' | 'approved' | 'rejected';
	createdAt: unknown;
}

export type LinkResult = 'success' | 'rejected' | 'timeout' | 'invalid_code';

interface AuthContextType {
	user: User | null;
	loading: boolean;
	syncUid: string | null;
	activeUid: string | null;
	syncCode: string | null;
	pendingLinkRequest: LinkRequest | null;
	linkDevice: (code: string) => Promise<LinkResult>;
	unlinkDevice: () => void;
	approveLinkRequest: (requestId: string) => Promise<void>;
	rejectLinkRequest: (requestId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [syncUid, setSyncUid] = useState<string | null>(() => {
		return localStorage.getItem('elfarsante_sync_uid');
	});
	const [syncCode, setSyncCode] = useState<string | null>(null);
	const [pendingLinkRequest, setPendingLinkRequest] = useState<LinkRequest | null>(null);

	const [sessionId] = useState(() => Math.random().toString(36).substring(2, 10));

	const generateReadableCode = useCallback(() => {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let result = '';
		for (let i = 0; i < 6; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
			if (i === 2) result += '-';
		}
		return result;
	}, []);

	const fetchOrCreateSyncCode = useCallback(
		async (uid: string) => {
			const q = query(collection(db, 'sync_codes'), where('uid', '==', uid));
			const querySnapshot = await getDocs(q);

			if (!querySnapshot.empty) {
				setSyncCode(querySnapshot.docs[0].id);
			} else {
				const newCode = generateReadableCode();
				await setDoc(doc(db, 'sync_codes', newCode), { uid });
				setSyncCode(newCode);
			}
		},
		[generateReadableCode],
	);

	useEffect(() => {
		initAuth().catch(console.error);

		const unsubscribe = onAuthStateChanged(auth, async (u) => {
			setUser(u);
			setLoading(false);
		});

		return unsubscribe;
	}, []);

	// Sync syncCode whenever the user or syncUid changes
	useEffect(() => {
		const activeId = syncUid || user?.uid;
		if (activeId) {
			setTimeout(() => fetchOrCreateSyncCode(activeId), 0);
		}
	}, [user, syncUid, fetchOrCreateSyncCode]);

	// Listen for incoming link requests directed at my active profile
	useEffect(() => {
		const activeId = syncUid || user?.uid;
		if (!activeId) return;

		const q = query(
			collection(db, 'link_requests'),
			where('targetUid', '==', activeId),
			where('status', '==', 'pending'),
		);

		const unsubscribe = onSnapshot(q, (snapshot) => {
			if (!snapshot.empty) {
				// Just take the first pending request
				const docData = snapshot.docs[0];
				setPendingLinkRequest({ id: docData.id, ...docData.data() } as LinkRequest);
			} else {
				setPendingLinkRequest(null);
			}
		});

		return unsubscribe;
	}, [user, syncUid]);

	const linkDevice = async (code: string): Promise<LinkResult> => {
		const cleanCode = code.toUpperCase().trim();
		const docRef = doc(db, 'sync_codes', cleanCode);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return 'invalid_code';
		}

		const targetUid = docSnap.data().uid;

		// Create a link request
		const requestId = `req_${Date.now()}_${sessionId}`;
		const requestRef = doc(db, 'link_requests', requestId);

		await setDoc(requestRef, {
			targetUid,
			requesterSessionId: sessionId,
			status: 'pending',
			createdAt: serverTimestamp(),
		});

		// Wait for the request to be approved or rejected (or timeout after 60s)
		return new Promise((resolve) => {
			const unsubscribe = onSnapshot(requestRef, (snap) => {
				const data = snap.data();
				if (!data) return;

				if (data.status === 'approved') {
					clearTimeout(timeoutId);
					unsubscribe();
					localStorage.setItem('elfarsante_sync_uid', targetUid);
					setSyncUid(targetUid);
					resolve('success');
				} else if (data.status === 'rejected') {
					clearTimeout(timeoutId);
					unsubscribe();
					resolve('rejected');
				}
			});

			const timeoutId = setTimeout(() => {
				unsubscribe();
				// Mark as timed out in DB so target device doesn't see it forever if it comes back online
				updateDoc(requestRef, { status: 'timeout' }).catch(console.error);
				resolve('timeout');
			}, 60000); // 60 seconds
		});
	};

	const unlinkDevice = () => {
		localStorage.removeItem('elfarsante_sync_uid');
		setSyncUid(null);
	};

	const approveLinkRequest = async (requestId: string) => {
		const requestRef = doc(db, 'link_requests', requestId);
		await updateDoc(requestRef, { status: 'approved' });
		setPendingLinkRequest(null);
	};

	const rejectLinkRequest = async (requestId: string) => {
		const requestRef = doc(db, 'link_requests', requestId);
		await updateDoc(requestRef, { status: 'rejected' });
		setPendingLinkRequest(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				syncUid,
				activeUid: syncUid || user?.uid || null,
				syncCode,
				pendingLinkRequest,
				linkDevice,
				unlinkDevice,
				approveLinkRequest,
				rejectLinkRequest,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
