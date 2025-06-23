const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME
});

const checkDatabaseConnection = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database connected successfully");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
};

async function checkAndCreateTables() {
  const client = await pool.connect();
  try {
    const tableDDLs = {
      articles: `
        CREATE TABLE public.articles (
            id uuid DEFAULT gen_random_uuid() NOT NULL,
            title varchar(255) NOT NULL,
            "content" text NOT NULL,
            header_image_id uuid NULL,
            author_id uuid NULL,
            is_published bool DEFAULT false NULL,
            created_at timestamptz DEFAULT now() NULL,
            updated_at timestamptz DEFAULT now() NULL,
            CONSTRAINT articles_pkey PRIMARY KEY (id)
        );
      `,
      device_sensors: `
        CREATE TABLE public.device_sensors (
            id uuid DEFAULT gen_random_uuid() NOT NULL,
            device_id uuid NOT NULL,
            sensor_type_id uuid NOT NULL,
            created_at timestamptz DEFAULT now() NULL,
            CONSTRAINT device_sensors_device_id_sensor_type_id_key UNIQUE (device_id, sensor_type_id),
            CONSTRAINT device_sensors_pkey PRIMARY KEY (id),
            CONSTRAINT device_sensors_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.onboarding_devices(id) ON DELETE CASCADE,
            CONSTRAINT device_sensors_sensor_type_id_fkey FOREIGN KEY (sensor_type_id) REFERENCES public.sensor_types(id) ON DELETE CASCADE
        );
      `,
      onboarding_devices: `
        CREATE TABLE public.onboarding_devices (
            id uuid DEFAULT gen_random_uuid() NOT NULL,
            "name" text NOT NULL,
            "location" text NOT NULL,
            user_id uuid NOT NULL,
            status text NOT NULL,
            created_at timestamptz DEFAULT now() NULL,
            updated_at timestamptz DEFAULT now() NULL,
            data_interval_seconds int4 NULL,
            CONSTRAINT onboarding_devices_pkey PRIMARY KEY (id),
            CONSTRAINT onboarding_devices_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
        );
      `,
      refresh_tokens: `
        CREATE TABLE public.refresh_tokens (
            id uuid DEFAULT gen_random_uuid() NOT NULL,
            user_id uuid NULL,
            refresh_token text NOT NULL,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
            expires_at timestamp NOT NULL,
            is_revoked bool DEFAULT false NULL,
            CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
            CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
        );
      `,
      sensor_types: `
        CREATE TABLE public.sensor_types (
            id uuid DEFAULT gen_random_uuid() NOT NULL,
            "name" text NOT NULL,
            unit text NULL,
            description text NULL,
            CONSTRAINT sensor_types_name_key UNIQUE (name),
            CONSTRAINT sensor_types_pkey PRIMARY KEY (id)
        );
      `,
      server_errors: `
        CREATE TABLE public.server_errors (
            id serial4 NOT NULL,
            message text NOT NULL,
            stack text NULL,
            request_url text NULL,
            request_method varchar(10) NULL,
            request_body jsonb NULL,
            created_at timestamp DEFAULT now() NULL,
            CONSTRAINT server_errors_pkey PRIMARY KEY (id)
        );
      `,
      users: `
        CREATE TABLE public.users (
            id uuid DEFAULT gen_random_uuid() NOT NULL,
            "name" varchar(255) NOT NULL,
            email varchar(255) NOT NULL,
            password_hash varchar(255) NOT NULL,
            "role" varchar(50) DEFAULT 'user'::character varying NULL,
            is_active bool DEFAULT false NOT NULL,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
            verification_code varchar STORAGE MAIN NULL,
            CONSTRAINT users_email_key UNIQUE (email),
            CONSTRAINT users_pkey PRIMARY KEY (id)
        );
      `,
      warnings: `
        CREATE TABLE public.warnings (
            id uuid DEFAULT gen_random_uuid() NOT NULL,
            message varchar(500) NOT NULL,
            "type" varchar(50) DEFAULT 'general'::character varying NULL,
            is_active bool DEFAULT true NULL,
            created_at timestamptz DEFAULT now() NULL,
            updated_at timestamptz DEFAULT now() NULL,
            CONSTRAINT warnings_pkey PRIMARY KEY (id)
        );
      `,
    };

    for (const tableName in tableDDLs) {
      const checkTableQuery = `SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = '${tableName}'
      );`;

      const res = await client.query(checkTableQuery);
      const tableExists = res.rows[0].exists;

      if (!tableExists) {
        console.log(`Table '${tableName}' does not exist. Creating it...`);
        await client.query(tableDDLs[tableName]);
        console.log(`Table '${tableName}' created successfully.`);
      } else {
        console.log(`Table '${tableName}' already exists. Skipping creation.`);
      }
    }
  } catch (error) {
    console.error("Error checking or creating tables:", error);
    process.exit(1);
  } finally {
    client.release();
  }
}

module.exports = { pool, checkDatabaseConnection, checkAndCreateTables };
