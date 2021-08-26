import axios, { AxiosError } from 'axios';

process.on('unhandledRejection', (error) => {
  console.error('error', error);

  process.exit(1);
});

export function parseArguments<T>(args: string[], expectedArgs: string[]): T {
  const parsedArgs: any = {};

  args.forEach((arg, index) => {
    if (expectedArgs.includes(arg)) {
      const nextArgument = args[index + 1];

      if (!nextArgument) {
        throw new Error('bad_arguments');
      }

      parsedArgs[arg.substring(2)] = nextArgument;
    }
  });

  return parsedArgs;
}

export async function retrieveToken({
  tenantId,
  username,
  password,
  clientId,
  clientSecret,
  scope,
  resource,
}: {
  tenantId: string;
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  resource: string;
}): Promise<string> {
  const { data } = await axios.post<{ access_token: string }>(
    `https://login.windows.net/${tenantId}/oauth2/token`,
    [
      'grant_type=password',
      `username=${username}`,
      `password=${password}`,
      `client_id=${clientId}`,
      `client_secret=${clientSecret}`,
      `scope=${scope}`,
      `resource=${resource}`,
    ].join('&'),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  return data.access_token;
}

export async function getReportsByGroupId({
  authToken,
  groupName,
}: {
  authToken: string;
  groupName: string;
}) {
  const {
    data: { value: groups },
  } = await axios.get<{
    value: {
      id: string;
      name: string;
    }[];
  }>(`https://api.powerbi.com/v1.0/myorg/groups`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  let groupId: string = null;

  groups.forEach((group) => {
    if (group.name === groupName) {
      groupId = group.id;
    }
  });

  if (!groupId) {
    throw new Error(`GROUP ID NOT FOUND BY NAME: ${groupName}`);
  }

  console.log(`GROUP ID FOUND BY NAME: ${groupName}`);

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

  return {
    groupId,
    reports: value,
  };
}

export async function updateReportsDatasetReference({
  groupId,
  currentReports,
  reports,
  requestBody,
  authToken,
}: {
  groupId: string;
  currentReports: {
    id: string;
    name: string;
    datasetId: string;
  }[];
  reports: string[];
  requestBody: { datasetId: string };
  authToken: string;
}) {
  for (const currentReport of currentReports) {
    if (reports.includes(currentReport.name)) {
      if (currentReport.datasetId === requestBody.datasetId) {
        console.log(`SKIPPING: ALREADY BOUND: ${currentReport.name}`);

        continue;
      }

      try {
        await axios.post(
          `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${currentReport.id}/Rebind`,
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        console.log(
          `REBOUND: ${currentReport.name}, OLD DATASET ID: ${currentReport.datasetId}, NEW DATASET ID: ${requestBody.datasetId}`,
        );
      } catch (error) {
        console.log(
          `REBIND FAILED: ${currentReport.name}, ERROR: ${error.message}`,
        );
      }
    } else {
      console.log(`SKIPPING: DOESN'T MATCH: ${currentReport.name}`);
    }
  }
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
    group_name,
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
    group_name: string;
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
    '--group_name',
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
  group_name: ${group_name}
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

  const { groupId, reports: reportsByGroup } = await getReportsByGroupId({
    authToken,
    groupName: group_name,
  });

  await updateReportsDatasetReference({
    groupId,
    currentReports: reportsByGroup.map((report) => ({
      id: report.id,
      name: report.name,
      datasetId: report.datasetId,
    })),
    reports: reportsJson,
    requestBody: requestBodyJson,
    authToken,
  });
})();
