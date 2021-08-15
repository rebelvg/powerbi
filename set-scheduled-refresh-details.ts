import axios from 'axios';

process.on('unhandledRejection', (error) => {
  console.error('error', error);

  process.exit(1);
});

export async function setScheduledRefreshDetails({
  authToken,
  groupId,
  datasetId,
  body,
}: {
  authToken: string;
  groupId: string;
  datasetId: string;
  body: {
    days: string[];
    enabled: boolean;
    times: string[];
    localTimeZoneId: string;
  };
}) {
  await axios.patch(
    `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/datasets/${datasetId}/refreshSchedule`,
    body,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );
}

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
    request_body,
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
    request_body: string;
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
    '--request_body',
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

  const requestBodyJson: {
    days: string;
    enabled: boolean;
    times: string;
    localTimeZoneId: string;
  } = JSON.parse(request_body);

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
    body: {
      days: JSON.parse(requestBodyJson.days),
      enabled: requestBodyJson.enabled,
      times: JSON.parse(requestBodyJson.times),
      localTimeZoneId: requestBodyJson.localTimeZoneId,
    },
  });
})();
