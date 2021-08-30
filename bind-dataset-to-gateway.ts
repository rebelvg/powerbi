import axios, { AxiosError } from 'axios';

async function bindDatasetToGateway({
  authToken,
  groupName,
  datasetId,
  body,
}: {
  authToken: string;
  groupName: string;
  datasetId: string;
  body: Record<string, any>;
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

  let groupId: string | null = null;

  groups.forEach((group) => {
    if (group.name === groupName) {
      groupId = group.id;
    }
  });

  if (!groupId) {
    throw new Error(`GROUP ID NOT FOUND BY NAME: ${groupName}`);
  }

  console.log(`GROUP ID FOUND BY NAME: ${groupName}`);

  try {
    await axios.post(
      `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/datasets/${datasetId}/Default.BindToGateway`,
      body,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );
  } catch (error) {
    console.log('REQUEST ERROR: ', (error as AxiosError)?.response?.data);

    throw error;
  }
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
    group_name,
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
    group_name: string;
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
    '--group_name',
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

  const requestBodyJson = JSON.parse(request_body);

  const authToken = await retrieveToken({
    tenantId: tenant_id,
    username,
    password,
    clientId: client_id,
    clientSecret: client_secret,
    scope,
    resource,
  });

  await bindDatasetToGateway({
    authToken,
    groupName: group_name,
    datasetId: dataset_id,
    body: requestBodyJson,
  });
})();
