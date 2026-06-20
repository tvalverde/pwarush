import { db } from './database';

/**
 * Factory reset: wipes all user data (active session, failed-question log, question usage).
 * The static question bank is left intact (it is content, not user data).
 */
export const wipeAllData = async (): Promise<void> => {
	await Promise.all([db.gameSession.clear(), db.failedQuestions.clear(), db.questionUsage.clear()]);
};
