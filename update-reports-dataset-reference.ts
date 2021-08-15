import axios from 'axios';

import { parseArguments, retrieveToken } from './get-group-id';

process.on('unhandledRejection', (error) => {
  console.error('error', error);

  process.exit(1);
});

async function getReportsByGroupId({
  authToken,
  groupId,
}: {
  authToken: string;
  groupId: string;
}) {
  const {
    data: { value },
  } = await axios.get<{
    value: {
      id: string;
      reportType: string;
      name: string;
      webUrl: string;
      embedUrl: string;
      isFromPbix: boolean;
      isOwnedByMe: boolean;
      datasetId: string;
      users: any[];
    }[];
  }>(`https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (value.length === 0) {
    throw new Error('no_reports_found');
  }

  return value;
}

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
    request_body,
    reports,
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
    request_body: string;
    reports: string;
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
    '--request_body',
    '--reports',
  ]);

  console.log('parsed_args', {
    tenant_id,
    username,
    client_id,
    scope,
    resource,
    environment,
    group_id,
    request_body,
    reports,
  });

  const authToken = await retrieveToken({
    tenantId: tenant_id,
    username,
    password,
    clientId: client_id,
    clientSecret: client_secret,
    scope,
    resource,
  });

  const reportsByGroup = await getReportsByGroupId({
    authToken,
    groupId: group_id,
  });

  console.log(reportsByGroup);
})();
