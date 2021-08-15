import { parseArguments, retrieveToken } from './get-group-id';
import {
  getReportsByGroupId,
  updateReportsDatasetReference,
} from './update-reports-dataset-reference';

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

  const requestBodyJson = JSON.parse(request_body);
  const reportsJson: string[] = JSON.parse(reports);

  console.log(`******************************************
  Arguments
  -----------
  tenant_id: ${tenant_id}
  username: ${username}
  client_id: ${client_id}
  scope: ${scope}
  resource: ${resource}
  environment: ${environment}
  request_body: ${request_body}
  reports: ${reports}
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

  const reportsByGroup = await getReportsByGroupId({
    authToken,
    groupId: group_id,
  });

  await updateReportsDatasetReference({
    groupId: group_id,
    currentReports: reportsByGroup.map((report) => ({
      id: report.id,
      datasetId: report.datasetId,
    })),
    reports: reportsJson,
    requestBody: requestBodyJson,
    authToken,
  });
})();
