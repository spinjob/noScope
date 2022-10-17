"use strict";
/*
 * Copyright 2022 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Portal2 = void 0;
var tslib_1 = require("tslib");
/**
 * @fileoverview This is the next version of <Portal>, reimplemented as a function component.
 *
 * It supports both the newer React context API and the legacy context API. Support for the legacy context API
 * will be removed in Blueprint v6.0.
 *
 * Portal2 is not currently used anywhere in Blueprint. We had to revert the change which updated the standard
 * <Portal> to use this implementation because of subtle breaks caused by interactions with the (long-deprecated)
 * react-hot-loader library. To be safe, we've left Portal as a class component for now, and will promote this Portal2
 * implementation to be the standard Portal in Blueprint v5.0.
 *
 * @see https://github.com/palantir/blueprint/issues/5511
 */
var React = tslib_1.__importStar(require("react"));
var ReactDOM = tslib_1.__importStar(require("react-dom"));
var Classes = tslib_1.__importStar(require("../../common/classes"));
var Errors = tslib_1.__importStar(require("../../common/errors"));
var props_1 = require("../../common/props");
var portalProvider_1 = require("../../context/portal/portalProvider");
var usePrevious_1 = require("../../hooks/usePrevious");
var REACT_CONTEXT_TYPES = {
    blueprintPortalClassName: function (obj, key) {
        if (obj[key] != null && typeof obj[key] !== "string") {
            return new Error(Errors.PORTAL_CONTEXT_CLASS_NAME_STRING);
        }
        return undefined;
    },
};
/**
 * This component detaches its contents and re-attaches them to document.body.
 * Use it when you need to circumvent DOM z-stacking (for dialogs, popovers, etc.).
 * Any class names passed to this element will be propagated to the new container element on document.body.
 */
function Portal2(props, legacyContext) {
    if (legacyContext === void 0) { legacyContext = {}; }
    var context = React.useContext(portalProvider_1.PortalContext);
    var _a = React.useState(false), hasMounted = _a[0], setHasMounted = _a[1];
    var _b = React.useState(), portalElement = _b[0], setPortalElement = _b[1];
    var createContainerElement = React.useCallback(function () {
        var container = document.createElement("div");
        container.classList.add(Classes.PORTAL);
        maybeAddClass(container.classList, props.className); // directly added to this portal element
        maybeAddClass(container.classList, context.portalClassName); // added via PortalProvider context
        var blueprintPortalClassName = legacyContext.blueprintPortalClassName;
        if (blueprintPortalClassName != null && blueprintPortalClassName !== "") {
            console.error(Errors.PORTAL_LEGACY_CONTEXT_API);
            maybeAddClass(container.classList, blueprintPortalClassName); // added via legacy context
        }
        return container;
    }, [props.className, context.portalClassName]);
    // create the container element & attach it to the DOM
    React.useEffect(function () {
        if (props.container == null) {
            return;
        }
        var newPortalElement = createContainerElement();
        props.container.appendChild(newPortalElement);
        setPortalElement(newPortalElement);
        setHasMounted(true);
        return function () {
            newPortalElement.remove();
            setHasMounted(false);
            setPortalElement(undefined);
        };
    }, [props.container, createContainerElement]);
    // wait until next successful render to invoke onChildrenMount callback
    React.useEffect(function () {
        var _a;
        if (hasMounted) {
            (_a = props.onChildrenMount) === null || _a === void 0 ? void 0 : _a.call(props);
        }
    }, [hasMounted, props.onChildrenMount]);
    // update className prop on portal DOM element when props change
    var prevClassName = (0, usePrevious_1.usePrevious)(props.className);
    React.useEffect(function () {
        if (portalElement != null) {
            maybeRemoveClass(portalElement.classList, prevClassName);
            maybeAddClass(portalElement.classList, props.className);
        }
    }, [props.className]);
    // Only render `children` once this component has mounted in a browser environment, so they are
    // immediately attached to the DOM tree and can do DOM things like measuring or `autoFocus`.
    // See long comment on componentDidMount in https://reactjs.org/docs/portals.html#event-bubbling-through-portals
    if (typeof document === "undefined" || !hasMounted || portalElement == null) {
        return null;
    }
    else {
        return ReactDOM.createPortal(props.children, portalElement);
    }
}
exports.Portal2 = Portal2;
Portal2.defaultProps = {
    container: typeof document !== "undefined" ? document.body : undefined,
};
Portal2.displayName = "".concat(props_1.DISPLAYNAME_PREFIX, ".Portal2");
Portal2.contextTypes = REACT_CONTEXT_TYPES;
function maybeRemoveClass(classList, className) {
    if (className != null && className !== "") {
        classList.remove.apply(classList, className.split(" "));
    }
}
function maybeAddClass(classList, className) {
    if (className != null && className !== "") {
        classList.add.apply(classList, className.split(" "));
    }
}
//# sourceMappingURL=portal2.js.map