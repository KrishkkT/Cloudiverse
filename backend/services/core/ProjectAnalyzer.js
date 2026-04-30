const fs = require('fs');
const path = require('path');

/**
 * Project Analyzer Service
 * Implements 3-Layer Deterministic Project Detection
 */
class ProjectAnalyzer {

    /**
     * analyze(repoPath)
     * @param {string} repoPath - Absolute path to the repository root
     * @returns {Object} AnalysisResult
     */
    static analyze(repoPath) {
        if (!fs.existsSync(repoPath)) {
            throw new Error(`Repository path not found: ${repoPath}`);
        }

        console.log(`[ProjectAnalyzer] 🔍 Analyzing: ${repoPath}`);

        // 1️⃣ LAYER 1: DOCKER DETECTION (Explicit Runtime)
        const dockerResult = this.detectDocker(repoPath);
        if (dockerResult) {
            console.log(`[ProjectAnalyzer] ✅ Layer 1 (Docker) Matched: ${JSON.stringify(dockerResult)}`);
            return dockerResult;
        }

        // 2️⃣ LAYER 2: FRAMEWORK & RUNTIME DETECTION
        const frameworkResult = this.detectFramework(repoPath);
        if (frameworkResult) {
            // ... (existing FULLSTACK_SPLIT logic)
            if (frameworkResult.strategy === 'FULLSTACK_SPLIT') {
                 console.log(`[ProjectAnalyzer] ⚠️ Layer 2 suspected FULLSTACK_SPLIT. Verifying structure...`);
                 const structureResult = this.detectStructure(repoPath);
                 if (structureResult) {
                     console.log(`[ProjectAnalyzer] ✅ Layer 3 (Structure) Confirmed Split: ${JSON.stringify(structureResult)}`);
                     return { ...frameworkResult, ...structureResult }; 
                 } else {
                     console.log(`[ProjectAnalyzer] ⚠️ Layer 3 failed to confirm split. Fallback to MONOLITH.`);
                     return { ...frameworkResult, strategy: 'CONTAINER', reason: 'Fullstack frameworks found but Monorepo structure missing' };
                 }
            }
            return frameworkResult;
        }

        // 🐍 PYTHON DETECTION
        const pythonResult = this.detectPython(repoPath);
        if (pythonResult) return pythonResult;

        // ☕ JAVA DETECTION
        const javaResult = this.detectJava(repoPath);
        if (javaResult) return javaResult;

        // 🐹 GO DETECTION
        const goResult = this.detectGo(repoPath);
        if (goResult) return goResult;
        
        // 3️⃣ LAYER 3: GENERIC STRUCTURE (Last Resort)
        // If no package.json or unknown stack, check generic patterns (e.g., just static HTML)
        const genericResult = this.detectGeneric(repoPath);
        if (genericResult) {
            console.log(`[ProjectAnalyzer] ✅ Layer 3 (Generic) Matched: ${JSON.stringify(genericResult)}`);
            return genericResult;
        }

        // ❌ UNKNOWN
        console.error(`[ProjectAnalyzer] 🛑 Could not detect project type.`);
        return {
            strategy: 'UNKNOWN',
            reason: 'No Dockerfile, framework, or standard structure detected.'
        };
    }

    /**
     * Layer 1: Docker
     */
    static detectDocker(repoPath) {
        const files = fs.readdirSync(repoPath);
        if (files.includes('Dockerfile')) {
            return {
                strategy: 'CONTAINER',
                runtime: 'docker',
                framework: 'custom',
                builder: 'docker',
                reason: 'Found Dockerfile'
            };
        }
        if (files.includes('docker-compose.yml') || files.includes('docker-compose.yaml')) {
             return {
                strategy: 'CONTAINER', // Or MULTI_CONTAINER in future
                runtime: 'docker-compose',
                framework: 'custom',
                builder: 'docker',
                reason: 'Found docker-compose.yml'
            };
        }
        return null;
    }

    /**
     * Layer 2: Framework (package.json)
     */
    static detectFramework(repoPath) {
        const pkgPath = path.join(repoPath, 'package.json');
        if (!fs.existsSync(pkgPath)) return null;

        let pkg;
        try {
            pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        } catch (e) {
            console.warn("[ProjectAnalyzer] Failed to parse package.json", e);
            return null;
        }

        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        const scripts = pkg.scripts || {};

        // 1. Identify Indicators
        const backendIndicators = ['express', 'fastify', 'nestjs', '@nestjs/core', 'koa', 'hapi', 'nodemailer', 'pg', 'mongoose', 'redis', 'socket.io'];
        const frontendIndicators = ['react', 'vue', 'svelte', 'vite', 'react-scripts', 'gatsby', 'astro', 'next'];
        
        const hasBackend = backendIndicators.some(f => deps[f]);
        const hasFrontend = frontendIndicators.some(f => deps[f]);

        // B. Mixed / Fullstack Check (Early Exit)
        // If we see BOTH frontend and backend indicators in the SAME package.json,
        // it's a monolith that should be containerized.
        if (hasBackend && hasFrontend && !deps['next']) {
             console.log(`[ProjectAnalyzer] 🔀 Mixed indicators found (Backend + Frontend). Analyzing structure...`);
             const structureResult = this.detectStructure(repoPath);
             return {
                 strategy: 'CONTAINER', // Primary strategy is still CONTAINER
                 runtime: 'node',
                 framework: 'mixed-monolith',
                 builder: 'docker',
                 structure: structureResult?.structure || null,
                 reason: 'Detected both frontend and backend indicators in root package.json'
             };
        }

        if (pkg.workspaces) {
             return {
                 strategy: 'FULLSTACK_SPLIT', // Workspaces imply monorepo
                 runtime: 'node',
                 framework: 'monorepo',
                 reason: 'Detected npm/yarn workspaces'
             };
        }

        // C. Next.js Check (Most Complex)
        // C. Next.js Check (Most Complex)
        if (deps['next']) {
            // Check next.config.js for "output: export"
            let isStatic = false;
            const nextConfigPath = path.join(repoPath, 'next.config.js');
            const nextConfigMjsPath = path.join(repoPath, 'next.config.mjs');
            
            try {
                if (fs.existsSync(nextConfigPath)) {
                    const content = fs.readFileSync(nextConfigPath, 'utf8');
                    if (content.includes(`output: 'export'`) || content.includes(`output: "export"`)) isStatic = true;
                } else if (fs.existsSync(nextConfigMjsPath)) {
                     const content = fs.readFileSync(nextConfigMjsPath, 'utf8');
                     if (content.includes(`output: 'export'`) || content.includes(`output: "export"`)) isStatic = true;
                }
            } catch (e) { /* ignore */ }

            if (scripts.build && scripts.build.includes('next export')) isStatic = true;
            if (scripts.export) isStatic = true;

            if (isStatic) {
                return {
                    strategy: 'STATIC',
                    runtime: 'node',
                    framework: 'next',
                    builder: 'npm',
                    buildCommand: 'npm run build',
                    outputDir: 'out',
                    reason: 'Next.js with static export detected'
                };
            } else {
                return {
                    strategy: 'CONTAINER',
                    runtime: 'node',
                    framework: 'next',
                    builder: 'docker',
                    reason: 'Next.js SSR detected (default)'
                };
            }
        }

        // D. Static Frameworks (Vite, React, Vue, etc.)
        const staticIndicators = [
            { id: 'vite', check: d => d['vite'], out: 'dist' },
            { id: 'react-scripts', check: d => d['react-scripts'], out: 'build' },
            { id: 'gatsby', check: d => d['gatsby'], out: 'public' },
            { id: 'astro', check: d => d['astro'], out: 'dist' },
            { id: 'nuxt', check: d => d['nuxt'], out: '.output/public' },
        ];

        for (const ind of staticIndicators) {
            if (ind.check(deps)) {
                return {
                    strategy: 'STATIC',
                    runtime: 'node',
                    framework: ind.id,
                    builder: 'npm',
                    buildCommand: 'npm run build',
                    outputDir: ind.out,
                    reason: `Matched static framework: ${ind.id}`
                };
            }
        }

        // E. Backend API Frameworks
        if (hasBackend) {
            return {
                strategy: 'CONTAINER',
                runtime: 'node',
                framework: 'express-like',
                builder: 'docker',
                reason: 'Backend framework detected'
            };
        }
        
        // Fallback: If only scripts.start exists -> Container
        if (scripts.start) {
            return {
                strategy: 'CONTAINER',
                runtime: 'node',
                framework: 'node-generic',
                builder: 'docker',
                reason: 'Generic Node.js (has start script)'
            };
        }

        return null;
    }

    /**
     * Layer 3: Folder Structure
     */
    static detectStructure(repoPath) {
        const dirs = fs.readdirSync(repoPath).filter(f => {
            try { return fs.statSync(path.join(repoPath, f)).isDirectory(); } 
            catch { return false; }
        });

        // Heuristics for Split
        const clientDirs = ['client', 'frontend', 'web', 'ui', 'app'];
        const serverDirs = ['server', 'backend', 'api', 'services'];

        const hasClient = dirs.find(d => clientDirs.includes(d));
        const hasServer = dirs.find(d => serverDirs.includes(d));

        if (hasClient && hasServer) {
            return {
                strategy: 'FULLSTACK_SPLIT',
                structure: {
                    frontend: hasClient,
                    backend: hasServer
                },
                reason: `Found separate folders: ${hasClient} & ${hasServer}`
            };
        }

        // Check 'apps' folder (Monorepo standard)
        if (dirs.includes('apps')) {
             const appsPath = path.join(repoPath, 'apps');
             const apps = fs.readdirSync(appsPath);
             // Verify at least 2 apps? logic can be extended
             return {
                 strategy: 'FULLSTACK_SPLIT',
                 structure: { appsDir: 'apps', apps },
                 reason: 'Found apps directory'
             };
        }

        return null;
    }

    /**
     * Layer 4: Generic / Static HTML
     */
    static detectGeneric(repoPath) {
        const files = fs.readdirSync(repoPath);

        // Pure Static HTML
        if (files.includes('index.html')) {
            return {
                strategy: 'STATIC',
                runtime: 'static',
                framework: 'html',
                builder: 'none',
                outputDir: '.',
                reason: 'Found index.html at root'
            };
        }
        
        // Serverless (serverless.yml)
        if (files.includes('serverless.yml') || files.includes('serverless.yaml')) {
             return {
                 strategy: 'SERVERLESS',
                 runtime: 'serverless-framework',
                 framework: 'serverless',
                 reason: 'Found serverless.yml'
             };
        }

        return null;
    }
    /**
     * Python Detection
     */
    static detectPython(repoPath) {
        const files = fs.readdirSync(repoPath);
        if (files.includes('requirements.txt') || files.includes('Pipfile') || files.includes('pyproject.toml')) {
            return {
                strategy: 'CONTAINER',
                runtime: 'python',
                builder: 'docker',
                reason: 'Python requirements/config found'
            };
        }
        return null;
    }

    /**
     * Java Detection
     */
    static detectJava(repoPath) {
        const files = fs.readdirSync(repoPath);
        if (files.includes('pom.xml')) {
            return {
                strategy: 'CONTAINER',
                runtime: 'java',
                framework: 'maven',
                builder: 'docker',
                reason: 'Maven pom.xml found'
            };
        }
        if (files.includes('build.gradle') || files.includes('build.gradle.kts')) {
            return {
                strategy: 'CONTAINER',
                runtime: 'java',
                framework: 'gradle',
                builder: 'docker',
                reason: 'Gradle build file found'
            };
        }
        return null;
    }

    /**
     * Go Detection
     */
    static detectGo(repoPath) {
        const files = fs.readdirSync(repoPath);
        if (files.includes('go.mod')) {
            return {
                strategy: 'CONTAINER',
                runtime: 'go',
                builder: 'docker',
                reason: 'Go modules (go.mod) found'
            };
        }
        return null;
    }
}

module.exports = ProjectAnalyzer;
