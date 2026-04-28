-- ===============================================================
-- CLOUDIVERSE COMPREHENSIVE DATABASE SCHEMA
-- Generated: 2026-04-27
-- Description: Complete SQL script for all application tables, 
--              enums, and automation triggers.
-- ===============================================================

-- ---------------------------------------------------------------
-- 0. EXTENSIONS & PREPARATION
-- ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------
-- 1. CUSTOM ENUM TYPES
-- ---------------------------------------------------------------

-- Roles within a project
DO $$ BEGIN
    CREATE TYPE project_role AS ENUM ('owner', 'member', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status of a service deployment
DO $$ BEGIN
    CREATE TYPE service_status AS ENUM ('pending', 'deploying', 'running', 'failed', 'stopped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Types of cloud services
DO $$ BEGIN
    CREATE TYPE service_type AS ENUM ('frontend', 'backend', 'database', 'cache', 'worker');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ---------------------------------------------------------------
-- 2. CORE IDENTITY TABLES
-- ---------------------------------------------------------------

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    company VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    device_id VARCHAR(255),
    google_id VARCHAR(255),
    avatar_url TEXT,
    
    -- Cloud Credentials stored as encrypted JSON or specific fields
    cloud_credentials JSONB DEFAULT '{}'::jsonb,
    
    -- Usage quotas
    ai_usage_count INTEGER DEFAULT 0,
    terraform_export_count INTEGER DEFAULT 0,
    report_export_count INTEGER DEFAULT 0,
    diagram_export_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Global Application Settings
CREATE TABLE IF NOT EXISTS global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_mode BOOLEAN DEFAULT false,
    announcement_banner TEXT,
    join_link TEXT,
    instagram_url TEXT,
    linkedin_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 3. SUBSCRIPTIONS & BILLING
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL DEFAULT 'free',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    razorpay_customer_id VARCHAR(255),
    razorpay_subscription_id VARCHAR(255),
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ---------------------------------------------------------------
-- 4. PROJECTS & WORKSPACES
-- ---------------------------------------------------------------

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id VARCHAR(255), -- Matches current system usage (VARCHAR user_id)
    created_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Project Members (Team Access)
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role project_role DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Workspaces Table (Core Design State)
CREATE TABLE IF NOT EXISTS workspaces (
    id SERIAL PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id VARCHAR(255), -- Links to user ownership
    name VARCHAR(255) NOT NULL DEFAULT 'Untitled Workspace',
    step VARCHAR(50) NOT NULL DEFAULT 'input',
    state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    save_count INTEGER DEFAULT 0,
    
    -- Deployment Status
    deployment_status VARCHAR(50) DEFAULT 'DRAFT',
    deployed_at TIMESTAMP,
    deployment_history JSONB DEFAULT '[]'::jsonb,
    last_deployment_at TIMESTAMP,
    
    -- Repository & CI/CD Linkage
    repo_url VARCHAR(255),
    ci_config JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspaces_project ON workspaces(project_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_user ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_repo_url ON workspaces(repo_url);

-- Infrastructure Specifications (Versioned Specs)
CREATE TABLE IF NOT EXISTS infra_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    spec_data JSONB NOT NULL,
    ai_prompt TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- 5. SERVICES & DEPLOYMENTS
-- ---------------------------------------------------------------

-- Services within a project
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type service_type NOT NULL,
    status service_status DEFAULT 'pending',
    config JSONB DEFAULT '{}'::jsonb,
    github_repo VARCHAR(255),
    github_branch VARCHAR(255),
    auto_deploy BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deployment History
CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    version_id UUID, -- Links to specific infra_spec version if needed
    source_type VARCHAR(50) DEFAULT 'github',
    status VARCHAR(50) DEFAULT 'pending',
    url TEXT,
    deployed_url VARCHAR(255),
    commit_sha VARCHAR(100),
    commit_hash VARCHAR(100),
    image_tag VARCHAR(100),
    version INTEGER DEFAULT 1,
    storage_path TEXT,
    config JSONB,
    logs JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detailed Deployment Logs
CREATE TABLE IF NOT EXISTS deployment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID REFERENCES deployments(id) ON DELETE CASCADE,
    log_level VARCHAR(20) DEFAULT 'info',
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- 6. ANALYTICS & FEEDBACK
-- ---------------------------------------------------------------

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost Feedback Table
CREATE TABLE IF NOT EXISTS cost_feedback (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    cost_intent VARCHAR(50),
    estimated_min DECIMAL(12,2),
    estimated_max DECIMAL(12,2),
    selected_provider VARCHAR(50),
    selected_profile VARCHAR(50),
    user_feedback VARCHAR(255),
    feedback_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost Estimation History
CREATE TABLE IF NOT EXISTS cost_history (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    cost_profile VARCHAR(50),
    estimated_cost DECIMAL(12,2),
    cost_range_low DECIMAL(12,2),
    cost_range_high DECIMAL(12,2),
    confidence VARCHAR(50),
    category_breakdown JSONB,
    service_count INTEGER,
    scale_tier VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- 7. EXTERNAL CONNECTIONS & AUTH
-- ---------------------------------------------------------------

-- GitHub Installations / OAuth Connections
CREATE TABLE IF NOT EXISTS github_installations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    installation_id VARCHAR(255),
    account_name VARCHAR(255),
    account_avatar TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cloud Provider Connections (Credentials)
CREATE TABLE IF NOT EXISTS user_cloud_connections (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    connection_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'connected',
    verified BOOLEAN DEFAULT true,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider)
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- 8. UTILITIES & TEMPLATES
-- ---------------------------------------------------------------

-- Infrastructure Templates
CREATE TABLE IF NOT EXISTS infrastructure_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255),
    template_json JSONB NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_by VARCHAR(255),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Environments (e.g., Staging, Production)
CREATE TABLE IF NOT EXISTS environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- 9. AUTOMATION (TRIGGERS)
-- ---------------------------------------------------------------

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
          AND table_schema = 'public'
          AND table_name NOT IN ('global_settings') -- Already handles with WITH TIME ZONE usually
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;
