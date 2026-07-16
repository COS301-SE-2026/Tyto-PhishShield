import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export class PostgreSQLFactory {
    private containers: StartedPostgreSqlContainer[] = [];

    public async createContainer() {
        const postgres = await new PostgreSqlContainer('15-alpine').start();
        this.containers.push(postgres);
        return postgres;
    }

    public async stopAllContainers() {
        this.containers.forEach(container => (
            container.stop()
        ));
    }
}