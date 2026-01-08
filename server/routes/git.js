const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const registerGitRoutes = (app) => {
  // === GIT STATUS ===
  app.get('/api/admin/git/status', async (_req, res) => {
    try {
      const branch = await execPromise('git rev-parse --abbrev-ref HEAD');
      const commit = await execPromise('git rev-parse HEAD');
      const message = await execPromise('git log -1 --pretty=%B');
      const date = await execPromise('git log -1 --pretty=%ci');
      const status = await execPromise('git status --porcelain');
      
      res.json({
        currentBranch: branch.stdout.trim(),
        currentCommit: commit.stdout.trim(),
        lastCommitMessage: message.stdout.trim(),
        lastCommitDate: date.stdout.trim(),
        isDirty: status.stdout.trim().length > 0
      });
    } catch (e) {
      console.error('Git status error:', e);
      res.status(500).json({ error: 'Erreur Git', details: e.message });
    }
  });

  // === CHECK UPDATES ===
  app.get('/api/admin/git/check-updates', async (_req, res) => {
    try {
      // Fetch les dernières infos du remote
      await execPromise('git fetch origin');
      
      const local = await execPromise('git rev-parse HEAD');
      
      // Déterminer la branche actuelle pour comparer avec le bon remote
      const branchResult = await execPromise('git rev-parse --abbrev-ref HEAD');
      const currentBranch = branchResult.stdout.trim();
      
      // Essayer origin/main puis origin/master
      let remote;
      let remoteBranch = `origin/${currentBranch}`;
      try {
        remote = await execPromise(`git rev-parse ${remoteBranch}`);
      } catch {
        try {
          remoteBranch = 'origin/main';
          remote = await execPromise(`git rev-parse ${remoteBranch}`);
        } catch {
          remoteBranch = 'origin/master';
          remote = await execPromise(`git rev-parse ${remoteBranch}`);
        }
      }
      
      const behind = await execPromise(`git rev-list HEAD..${remoteBranch} --count`);
      const remoteMessage = await execPromise(`git log ${remoteBranch} -1 --pretty=%B`);
      
      const behindCount = parseInt(behind.stdout.trim(), 10);
      
      res.json({
        hasUpdates: behindCount > 0,
        behindBy: behindCount,
        localCommit: local.stdout.trim(),
        latestRemoteCommit: remote.stdout.trim(),
        latestRemoteMessage: remoteMessage.stdout.trim(),
        remoteBranch
      });
    } catch (e) {
      console.error('Check updates error:', e);
      res.status(500).json({ error: 'Erreur vérification', details: e.message });
    }
  });

  // === PULL UPDATES ===
  app.post('/api/admin/git/pull', async (_req, res) => {
    try {
      // Déterminer la branche actuelle
      const branchResult = await execPromise('git rev-parse --abbrev-ref HEAD');
      const currentBranch = branchResult.stdout.trim();
      
      // Stash les modifications locales si nécessaire
      const status = await execPromise('git status --porcelain');
      const hasLocalChanges = status.stdout.trim().length > 0;
      
      if (hasLocalChanges) {
        console.log('📦 Stashing local changes before pull...');
        await execPromise('git stash');
      }
      
      // Pull depuis origin
      const result = await execPromise(`git pull origin ${currentBranch}`);
      
      // Restaurer les modifications locales si elles existaient
      if (hasLocalChanges) {
        try {
          console.log('📦 Restoring stashed changes...');
          await execPromise('git stash pop');
        } catch (stashError) {
          console.warn('⚠️ Could not restore stashed changes:', stashError.message);
        }
      }
      
      res.json({
        success: true,
        output: result.stdout,
        message: 'Mises à jour appliquées'
      });
      
      // Optionnel: redémarrer le serveur après un délai
      // Le process manager (pm2, nodemon) redémarrera le serveur
      setTimeout(() => {
        console.log('🔄 Redémarrage du serveur après mise à jour...');
        process.exit(0);
      }, 2000);
      
    } catch (e) {
      console.error('Git pull error:', e);
      res.status(500).json({ error: 'Erreur pull', details: e.message });
    }
  });

  // === COMMITS HISTORY ===
  app.get('/api/admin/git/commits', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      // Utiliser un séparateur unique pour parser les commits
      const separator = '|||COMMIT_SEP|||';
      const format = `--pretty=format:%H${separator}%s${separator}%an${separator}%ci${separator}`;
      const result = await execPromise(`git log -${limit} ${format}`);
      
      const lines = result.stdout.trim().split('\n').filter(line => line.trim());
      const commits = lines.map(line => {
        const parts = line.split(separator);
        return {
          hash: parts[0] || '',
          message: parts[1] || '',
          author: parts[2] || '',
          date: parts[3] || ''
        };
      }).filter(c => c.hash);
      
      res.json({ commits });
    } catch (e) {
      console.error('Git commits error:', e);
      res.status(500).json({ error: 'Erreur commits', details: e.message });
    }
  });

  // === GIT INFO (version simplifiée pour le status bar) ===
  app.get('/api/admin/git/info', async (_req, res) => {
    try {
      const commit = await execPromise('git rev-parse --short HEAD');
      const branch = await execPromise('git rev-parse --abbrev-ref HEAD');
      
      res.json({
        shortCommit: commit.stdout.trim(),
        branch: branch.stdout.trim()
      });
    } catch (e) {
      res.status(500).json({ error: 'Git non disponible' });
    }
  });
};

module.exports = { registerGitRoutes };