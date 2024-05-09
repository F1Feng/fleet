import React from "react";
import { InjectedRouter } from "react-router";

import SoftwareIcon from "pages/SoftwarePage/components/icons/SoftwareIcon";

import LinkCell from "../LinkCell";

const baseClass = "software-name-cell";

interface ISoftwareNameCellProps {
  name: string;
  source: string;
  path?: string;
  router?: InjectedRouter;
}

const SoftwareNameCell = ({
  name,
  source,
  path,
  router,
}: ISoftwareNameCellProps) => {
  // NO path or router means it's not clickable. return
  // a non-clickable cell early
  if (!router || !path) {
    return (
      <div className={baseClass}>
        <SoftwareIcon name={name} source={source} />
        <span className="software-name">{name}</span>
      </div>
    );
  }

  const onClickSoftware = (e: React.MouseEvent) => {
    // Allows for button to be clickable in a clickable row
    e.stopPropagation();
    router.push(path);
  };

  return (
    <LinkCell
      className={baseClass}
      path={path}
      customOnClick={onClickSoftware}
      value={
        <>
          <SoftwareIcon name={name} source={source} />
          <span className="software-name">{name}</span>
        </>
      }
    />
  );
};

export default SoftwareNameCell;
