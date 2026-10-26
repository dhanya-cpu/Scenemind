-- SceneMind AI Database Initialization
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE robot_status AS ENUM ('idle', 'navigating', 'scanning', 'speaking', 'error', 'charging');
CREATE TYPE object_class AS ENUM (
    'person', 'table', 'chair', 'door', 'window', 'bottle', 'laptop',
    'monitor', 'backpack', 'fire_extinguisher', 'emergency_exit', 'trash_bin'
);
CREATE TYPE activity_type AS ENUM (
    'walking', 'standing', 'running', 'sitting', 'working',
    'reading', 'talking', 'falling', 'unknown'
);
CREATE TYPE relation_type AS ENUM (
    'on', 'under', 'beside', 'blocking', 'near', 'holding', 'sitting_on'
);

-- Robot state snapshots
CREATE TABLE IF NOT EXISTS robot_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
    position_z DOUBLE PRECISION NOT NULL DEFAULT 0,
    orientation_yaw DOUBLE PRECISION NOT NULL DEFAULT 0,
    battery_percent DOUBLE PRECISION NOT NULL DEFAULT 100,
    cpu_percent DOUBLE PRECISION,
    gpu_percent DOUBLE PRECISION,
    status robot_status NOT NULL DEFAULT 'idle',
    current_goal VARCHAR(255),
    current_task TEXT,
    current_decision TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_robot_states_created ON robot_states(created_at DESC);

-- Detected objects
CREATE TABLE IF NOT EXISTS detected_objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class object_class NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    bbox_x DOUBLE PRECISION NOT NULL,
    bbox_y DOUBLE PRECISION NOT NULL,
    bbox_w DOUBLE PRECISION NOT NULL,
    bbox_h DOUBLE PRECISION NOT NULL,
    track_id INTEGER,
    frame_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_detected_objects_created ON detected_objects(created_at DESC);
CREATE INDEX idx_detected_objects_class ON detected_objects(class);

-- Scene graph relationships
CREATE TABLE IF NOT EXISTS scene_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES detected_objects(id) ON DELETE CASCADE,
    relation relation_type NOT NULL,
    object_id UUID REFERENCES detected_objects(id) ON DELETE CASCADE,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scene descriptions (AI-generated)
CREATE TABLE IF NOT EXISTS scene_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    safety_assessment TEXT,
    recommended_path TEXT,
    raw_detections JSONB,
    scene_graph JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity activity_type NOT NULL,
    person_track_id INTEGER,
    confidence DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Navigation history
CREATE TABLE IF NOT EXISTS navigation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_x DOUBLE PRECISION NOT NULL,
    start_y DOUBLE PRECISION NOT NULL,
    goal_x DOUBLE PRECISION NOT NULL,
    goal_y DOUBLE PRECISION NOT NULL,
    path JSONB,
    planner VARCHAR(50),
    success BOOLEAN NOT NULL DEFAULT false,
    distance_travelled DOUBLE PRECISION,
    duration_seconds DOUBLE PRECISION,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI decisions
CREATE TABLE IF NOT EXISTS ai_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_type VARCHAR(100) NOT NULL,
    context JSONB,
    reasoning TEXT NOT NULL,
    action_taken TEXT,
    latency_ms DOUBLE PRECISION,
    model_used VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Voice logs
CREATE TABLE IF NOT EXISTS voice_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('input', 'output')),
    transcript TEXT NOT NULL,
    audio_path VARCHAR(500),
    intent VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Maps
CREATE TABLE IF NOT EXISTS maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    resolution DOUBLE PRECISION NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    origin_x DOUBLE PRECISION NOT NULL DEFAULT 0,
    origin_y DOUBLE PRECISION NOT NULL DEFAULT 0,
    map_data BYTEA,
    metadata JSONB,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics metrics
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(50),
    tags JSONB,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_metric_name ON analytics_metrics(metric_name, recorded_at DESC);

-- User activity
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
