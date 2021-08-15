import { parseArguments, retrieveToken } from './get-group-id';
import { setScheduledRefreshDetails } from './set-scheduled-refresh-details';

process.on('unhandledRejection', (error) => {
  console.error('error', error);

  process.exit(1);
});

(async () => {
  const {
    tenant_id,
    username,
    password,
    client_id,
    client_secret,
    scope,
    resource,
    environment,
    group_id,
    dataset_id,
  } = parseArguments<{
    tenant_id: string;
    username: string;
    password: string;
    client_id: string;
    client_secret: string;
    scope: string;
    resource: string;
    environment: string;
    group_id: string;
    dataset_id: string;
  }>(process.argv, [
    '--tenant_id',
    '--username',
    '--password',
    '--client_id',
    '--client_secret',
    '--scope',
    '--resource',
    '--environment',
    '--group_id',
    '--dataset_id',
  ]);

  console.log(`******************************************
  Arguments
  -----------
  tenant_id: ${tenant_id}
  username: ${username}
  client_id: ${client_id}
  scope: ${scope}
  resource: ${resource}
  environment: ${environment}
******************************************`);

  const authToken = await retrieveToken({
    tenantId: tenant_id,
    username,
    password,
    clientId: client_id,
    clientSecret: client_secret,
    scope,
    resource,
  });

  await setScheduledRefreshDetails({
    authToken,
    groupId: group_id,
    datasetId: dataset_id,
  });
})();
