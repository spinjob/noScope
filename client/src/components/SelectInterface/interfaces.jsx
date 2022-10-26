/*
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the terms of the LICENSE file distributed with this project.
 */

import { MenuItem } from "@blueprintjs/core";
import * as React from "react";

////// ** All imported and written to pull the user's interfaces from the database and display them in a dropdown menu.//////
// import lib from "../../../../lib";
// import { UserContext } from "../../context/UserContext";
// import jwt from "jsonwebtoken";

//Retrieve the current users imported APIs

export const userInterfaces = [
    {
        "_id": "63585af90c20eeda23606ad6",
        "uuid": "8bfdae78-c6e2-4199-874d-a748da3ef287",
        "name": "Otter Public API",
        "description": "Description for API",
        "version": "v1",
        "created_at": "2022-10-25 21:54:01",
        "updated_at": "2022-10-25 21:54:01",
        "deleted_at": null,
        "production_server": "",
        "sandbox_server": "",
        "created_by": "634d897585c3d9a0f8bb433b",
        "__v": 0
    },
    {
        "_id": "63587a1f14b5e9b8d7d6efb1",
        "uuid": "37d6706b-7025-4c20-a603-0f303bdcaba5",
        "name": "Doordash Marketplace API",
        "description": "Description for API",
        "version": "v2.0",
        "created_at": "2022-10-26 00:06:55",
        "updated_at": "2022-10-26 00:06:55",
        "deleted_at": null,
        "production_server": "",
        "sandbox_server": "",
        "created_by": "634d897585c3d9a0f8bb433b",
        "__v": 0
    },
    {
        "_id": "63587a1f14b5e9b8d7d6efb1",
        "uuid": "37d6706b-7025-4c20-a603-0f303bdcaba5",
        "name": "Uber Direct API",
        "description": "Description for API",
        "version": "v3.3",
        "created_at": "2022-10-26 00:06:55",
        "updated_at": "2022-10-26 00:06:55",
        "deleted_at": null,
        "production_server": "",
        "sandbox_server": "",
        "created_by": "634d897585c3d9a0f8bb433b",
        "__v": 0
    }
].map((m, index) => ({ ...m, rank: index + 1 }));

//export const userInterfaces = lib.retrieveInterfaces(userId).map((m, index) => ({ ...m, rank: index + 1 }));

export const renderInterfaces = (userInterface, { handleClick, modifiers, query }) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  const text = `${userInterface.rank}. ${userInterface.name}`;
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      label={userInterface.version}
      key={userInterface.rank}
      onClick={handleClick}
      text={highlightText(text, query)}
    />
  );
};

export const filterInterface = (query, userInterface) => {
  return (
    `${
        userInterface.rank
    }. ${userInterface.name.toLowerCase()} ${userInterface.version.toLowerCase()}`.indexOf(
      query.toLowerCase()
    ) >= 0
  );
};

function highlightText(text, query) {
  let lastIndex = 0;
  const words = query
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(escapeRegExpChars);
  if (words.length === 0) {
    return [text];
  }
  const regexp = new RegExp(words.join("|"), "gi");
  const tokens = [];
  while (true) {
    const match = regexp.exec(text);
    if (!match) {
      break;
    }
    const length = match[0].length;
    const before = text.slice(lastIndex, regexp.lastIndex - length);
    if (before.length > 0) {
      tokens.push(before);
    }
    lastIndex = regexp.lastIndex;
    tokens.push(<strong key={lastIndex}>{match[0]}</strong>);
  }
  const rest = text.slice(lastIndex);
  if (rest.length > 0) {
    tokens.push(rest);
  }
  return tokens;
}

function escapeRegExpChars(text) {
  return text.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

export const interfaceSelectProps = {
  itemPredicate: filterInterface,
  itemRenderer: renderInterfaces,
  items: userInterfaces
};
