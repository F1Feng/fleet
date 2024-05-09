import React, { useCallback, useContext, useMemo, useState } from "react";
import { InjectedRouter } from "react-router";
import { useQuery } from "react-query";
import { AxiosError } from "axios";

import hostAPI, { IGetHostSoftwareResponse } from "services/entities/hosts";
import deviceAPI, {
  IGetDeviceSoftwareResponse,
} from "services/entities/device_user";
import { IHostSoftware, ISoftware } from "interfaces/software";
import { DEFAULT_USE_QUERY_OPTIONS } from "utilities/constants";
import { NotificationContext } from "context/notification";

import Card from "components/Card";
import Spinner from "components/Spinner";
import DataError from "components/DataError";

import { generateSoftwareTableHeaders } from "./HostSoftwareTableConfig";
import HostSoftwareTable from "./HostSoftwareTable";

const baseClass = "software-card";

export interface ITableSoftware extends Omit<ISoftware, "vulnerabilities"> {
  vulnerabilities: string[]; // for client-side search purposes, we only want an array of cve strings
}

interface ISoftwareCardProps {
  /** This is the host id or the device token */
  id: number | string;
  router: InjectedRouter;
  queryParams?: {
    page?: string;
    query?: string;
    order_key?: string;
    order_direction?: "asc" | "desc";
  };
  pathname: string;
  onShowSoftwareDetails?: (software: IHostSoftware) => void;
  isSoftwareEnabled?: boolean;
  isMyDevicePage?: boolean;
}

const DEFAULT_SEARCH_QUERY = "";
const DEFAULT_SORT_DIRECTION = "desc";
const DEFAULT_SORT_HEADER = "name";
const DEFAULT_PAGE = 0;

const SoftwareCard = ({
  id,
  router,
  queryParams,
  pathname,
  onShowSoftwareDetails,
  isSoftwareEnabled = false,
  isMyDevicePage = false,
}: ISoftwareCardProps) => {
  const { renderFlash } = useContext(NotificationContext);

  const [installingSoftwareId, setInstallingSoftwareId] = useState<
    number | null
  >(null);

  const {
    data: hostSoftwareRes,
    isLoading: hostSoftwareLoading,
    isError: hostSoftwareError,
    isFetching: hostSoftwareFetching,
  } = useQuery<IGetHostSoftwareResponse, AxiosError>(
    ["host-software", queryParams],
    () => hostAPI.getHostSoftware(id as number),
    {
      ...DEFAULT_USE_QUERY_OPTIONS,
      enabled: isSoftwareEnabled && !isMyDevicePage,
    }
  );

  const {
    data: deviceSoftwareRes,
    isLoading: deviceSoftwareLoading,
    isError: deviceSoftwareError,
    isFetching: deviceSoftwareFetching,
  } = useQuery<IGetDeviceSoftwareResponse, AxiosError>(
    ["host-software", queryParams],
    () => deviceAPI.getDeviceSoftware(id as string),
    {
      ...DEFAULT_USE_QUERY_OPTIONS,
      enabled: isSoftwareEnabled && isMyDevicePage,
    }
  );

  const searchQuery = queryParams?.query ?? DEFAULT_SEARCH_QUERY;
  const sortHeader = queryParams?.order_key ?? DEFAULT_SORT_HEADER;
  const sortDirection = queryParams?.order_direction ?? DEFAULT_SORT_DIRECTION;
  const page = queryParams?.page
    ? parseInt(queryParams.page, 10)
    : DEFAULT_PAGE;

  const installHostSoftwarePackage = useCallback(
    async (softwareId: number) => {
      setInstallingSoftwareId(softwareId);
      try {
        await hostAPI.installHostSoftwarePackage(id as number, softwareId);
        renderFlash(
          "success",
          "Software is installing or will install when the host comes online."
        );
      } catch {
        renderFlash("error", "Couldn't install. Please try again.");
      }
      setInstallingSoftwareId(null);
    },
    [id, renderFlash]
  );

  const onSelectAction = useCallback(
    (software: IHostSoftware, action: string) => {
      switch (action) {
        case "install":
          installHostSoftwarePackage(software.id);
          break;
        case "showDetails":
          onShowSoftwareDetails?.(software);
          break;
        default:
          break;
      }
    },
    [installHostSoftwarePackage, onShowSoftwareDetails]
  );

  const tableHeaders = useMemo(() => {
    return generateSoftwareTableHeaders({
      router,
      installingSoftwareId,
      onSelectAction,
    });
  }, [installingSoftwareId, router, onSelectAction]);

  const renderSoftwareTable = () => {
    if (hostSoftwareLoading || deviceSoftwareLoading) {
      return <Spinner />;
    }

    if (hostSoftwareError || deviceSoftwareError) {
      return <DataError />;
    }

    if (!hostSoftwareRes || !deviceSoftwareRes) {
      return null;
    }

    return (
      <HostSoftwareTable
        isLoading={hostSoftwareFetching || deviceSoftwareFetching}
        data={isMyDevicePage ? hostSoftwareRes : deviceSoftwareRes}
        router={router}
        tableConfig={tableHeaders}
        sortHeader={sortHeader}
        sortDirection={sortDirection}
        searchQuery={searchQuery}
        page={page}
        pagePath={pathname}
      />
    );
  };

  return (
    <Card
      borderRadiusSize="large"
      includeShadow
      largePadding
      className={baseClass}
    >
      <p className="card__header">Software</p>
      {renderSoftwareTable()}
    </Card>
  );
};
export default SoftwareCard;
