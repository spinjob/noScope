/*
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the terms of the LICENSE file distributed with this project.
 */

import { MenuItem } from "@blueprintjs/core";
import React from "react";
////// ** All imported and written to pull the user's interfaces from the database and display them in a dropdown menu.//////
// import lib from "../../../../lib";
// import { UserContext } from "../../context/UserContext";
// import jwt from "jsonwebtoken";

//Retrieve the current users imported APIs

export const renderTriggers = (interfaceTrigger, { handleClick, modifiers, query }) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  const text = `${interfaceTrigger.rank}. ${interfaceTrigger.name}`;
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      label={interfaceTrigger.method}
      key={interfaceTrigger.rank}
      onClick={handleClick}
      text={highlightText(text, query)}
    />
  );
};

export const filterTriggers = (query, interfaceTrigger) => {
  return (
    `${
        interfaceTrigger.rank
    }. ${interfaceTrigger.name.toLowerCase()} ${interfaceTrigger.method.toLowerCase()}`.indexOf(
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
  itemPredicate: filterTriggers,
  itemRenderer: renderTriggers
};
