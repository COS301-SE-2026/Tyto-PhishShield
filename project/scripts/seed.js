import { execSync } from 'node:child_process';
import path from 'node:path';

const composeFile = 'project/docker-compose/local-compose.yml';
const envFile = 'project/docker-compose/.env.local';

function seed(container, database, sqlFile) {
    const file = path.resolve(sqlFile);

    execSync(
        `docker compose -f ${composeFile} --env-file ${envFile} exec -T ${container} psql -U FiveGuys -d ${database} -f - < "${file}"`,
        {
            stdio: "inherit",
            shell: true,
        }
    );
}

seed('education_db', 'education_db', 'project/backend/databases-seeds/education/seed.sql');
seed('mailing_db', 'mailing_db', 'project/backend/databases-seeds/mailing/seed.sql');
seed('accounts_db', 'accounts_db', 'project/backend/databases-seeds/accounts/seed.sql');
seed('xp_db', 'xp_db', 'project/backend/databases-seeds/xp/seed.sql');
seed('analytics_db', 'analytics_db', 'project/backend/databases-seeds/analytics/seed.sql');