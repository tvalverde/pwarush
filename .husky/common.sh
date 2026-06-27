# Shared by the git hooks: load the project's Node (.nvmrc) so commit/push run
# under Node 24 regardless of the shell's default (e.g. a system Node 25, which
# leaks globals that break the test suite). Sourced — does not exit on its own.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
	. "$NVM_DIR/nvm.sh"
	nvm use >/dev/null 2>&1 || nvm install >/dev/null 2>&1
fi
