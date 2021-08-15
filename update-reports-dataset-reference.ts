import axios from 'axios';

export async function getReportsByGroupId({
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
    datasetId: string;
  }[];
  reports: string[];
  requestBody: Record<string, any>;
  authToken: string;
}) {
  for (const currentReport of currentReports) {
    if (reports.includes(currentReport.id)) {
      try {
        await axios.post(
          `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${currentReport.id}/rebind`,
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );
      } catch (error) {
        console.error(
          'rebind_failed',
          error.message,
          currentReport.id,
          error?.response?.body,
        );
      }
    } else {
      console.log('not_in_reports', groupId, currentReport.id);
    }
  }
}
