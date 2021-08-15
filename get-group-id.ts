import axios from 'axios';
import * as _ from 'lodash';

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

export async function getGroupId({
  authToken,
  environment,
}: {
  authToken: string;
  environment: string;
}): Promise<string> {
  const {
    data: { value },
  } = await axios.get<{
    value: {
      name: string;
      id: string;
    }[];
  }>('https://api.powerbi.com/v1.0/myorg/groups', {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  let groupId: string | undefined;

  for (const group of value) {
    if (group.name === environment) {
      groupId = group.id;
    }
  }

  if (!groupId) {
    throw new Error('error_no_group_id');
  }

  console.log('get_group_id', groupId);

  return groupId;
}
