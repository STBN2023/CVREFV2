const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);

// Répertoire racine du projet (parent de server/)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Helper pour exécuter les commandes Git dans le bon répertoire
const gitExec = (command) => {
  return execPromise(command, { cwd: PROJECT_ROOT, encoding: 'utf8' });
};

const registerGitRoutes = (app) => {
  // === GIT STATUS ===
  app.get('/api/admin/git/status', async (_req, res) => {
    try {
      console.log('📁 Git working directory:', PROJECT_ROOT);
      
      const branch = await gitExec('git rev-parse --abbrev-ref HEAD');
      const commit = await gitExec('git rev-parse HEAD');
      const message = await gitExec('git log -1 --pretty=%B');
      const date = await gitExec('git log -1 --pretty=%ci');
      const status = await gitExec('git status --porcelain');
      
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
      console.log('🔄 Checking for updates in:', PROJECT_ROOT);
      
      // Déterminer la branche actuelle
      const branchResult = await gitExec('git rev-parse --abbrev-ref HEAD');
      const currentBranch = branchResult.stdout.trim();
      
      console.log('📌 Current branch:', currentBranch);
      
      // Fetch avec force pour éviter les problèmes de cache
      await gitExec(`git fetch origin ${currentBranch}:refs/remotes/origin/${currentBranch} --force`);
      
      const local = await gitExec('git rev-parse HEAD');
      
      // Déterminer la branche actuelle pour comparer avec le bon remote
      const branchResult2 = await gitExec('git rev-parse --abbrev-ref HEAD');
      const currentBranch2 = branchResult2.stdout.trim();
      
      console.log('📌 Current branch:', currentBranch2);
      
      // Essayer origin/[branche actuelle] puis origin/main puis origin/master
      let remote;
      let remoteBranch = `origin/${currentBranch2}`;
      try {
        remote = await gitExec(`git rev-parse ${remoteBranch}`);
        console.log('✅ Found remote branch:', remoteBranch);
      } catch (err1) {
        console.log('⚠️ Branch not found:', remoteBranch, '- trying origin/main');
        try {
          remoteBranch = 'origin/main';
          remote = await gitExec(`git rev-parse ${remoteBranch}`);
          console.log('✅ Found remote branch:', remoteBranch);
        } catch (err2) {
          console.log('⚠️ Branch not found:', remoteBranch, '- trying origin/master');
          remoteBranch = 'origin/master';
          remote = await gitExec(`git rev-parse ${remoteBranch}`);
          console.log('✅ Found remote branch:', remoteBranch);
        }
      }
      
      const behind = await gitExec(`git rev-list HEAD..${remoteBranch} --count`);
      const remoteMessage = await gitExec(`git log ${remoteBranch} -1 --pretty=%B`);
      
      const behindCount = parseInt(behind.stdout.trim(), 10);
      
      console.log('📊 Behind by:', behindCount, 'commits');
      
      res.json({
        hasUpdates: behindCount > 0,
        behindBy: behindCount,
        localCommit: local.stdout.trim(),
        latestRemoteCommit: remote.stdout.trim(),
        latestRemoteMessage: remoteMessage.stdout.trim(),
        remoteBranch,
        projectRoot: PROJECT_ROOT
      });
    } catch (e) {
      console.error('Check updates error:', e);
      res.status(500).json({ error: 'Erreur vérification', details: e.message });
    }
  });

  // === PULL UPDATES ===
  app.post('/api/admin/git/pull', async (_req, res) => {
    try {
      console.log('⬇️ Pulling updates in:', PROJECT_ROOT);
      
      // Déterminer la branche actuelle
      const branchResult = await gitExec('git rev-parse --abbrev-ref HEAD');
      const currentBranch = branchResult.stdout.trim();
      
      // Stash les modifications locales si nécessaire
      const status = await gitExec('git status --porcelain');
      const hasLocalChanges = status.stdout.trim().length > 0;
      
      if (hasLocalChanges) {
        console.log('📦 Stashing local changes before pull...');
        await gitExec('git stash');
      }
      
      // Pull depuis origin
      const result = await gitExec(`git pull origin ${currentBranch}`);
      
      console.log('✅ Pull result:', result.stdout);
      
      // Restaurer les modifications locales si elles existaient
      if (hasLocalChanges) {
        try {
          console.log('📦 Restoring stashed changes...');
          await gitExec('git stash pop');
        } catch (stashError) {
          console.warn('⚠️ Could not restore stashed changes:', stashError.message);
        }
      }
      
      res.json({
        success: true,
        output: result.stdout,
        message: 'Mises à jour appliquées. Redémarrage en cours...'
      });
      
      // Redémarrer le serveur après un délai
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
      
      const result = await gitExec(
        `git log -${limit} --pretty=format:"%H|%s|%an|%ci"`
      );
      
      const output = result.stdout.trim();
      
      if (!output) {
        return res.json({ commits: [] });
      }
      
      const commits = output.split('\n').map(line => {
        const parts = line.split('|');
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
      const commit = await gitExec('git rev-parse --short HEAD');
      const branch = await gitExec('git rev-parse --abbrev-ref HEAD');
      
      res.json({
        shortCommit: commit.stdout.trim(),
        branch: branch.stdout.trim()
      });
    } catch (e) {
      res.status(500).json({ error: 'Git non disponible' });
    }
  });
  
  // === DEBUG: Afficher le répertoire de travail ===
  app.get('/api/admin/git/debug', async (_req, res) => {
    try {
      const remotes = await gitExec('git remote -v');
      const branches = await gitExec('git branch -a');
      
      res.json({
        projectRoot: PROJECT_ROOT,
        remotes: remotes.stdout.trim(),
        branches: branches.stdout.trim()
      });
    } catch (e) {
      res.status(500).json({ error: e.message, projectRoot: PROJECT_ROOT });
    }
  });
};

module.exports = { registerGitRoutes };