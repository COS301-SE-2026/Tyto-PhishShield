import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export class PostgreSQLFactory {
    private static containers: StartedPostgreSqlContainer[] = [];

    public static async createContainer() {
        const postgres = await new PostgreSqlContainer('postgres:15-alpine').start();
        this.containers.push(postgres);
        return postgres;
    }

    public static async stopAllContainers() {
        this.containers.forEach(async container => (
            await container?.stop()
        ));
        this.containers = [];
    }
}