/*
 * Copyright 2015 Palantir Technologies, Inc. All rights reserved.
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
import { __extends } from "tslib";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Classes from "../../common/classes";
import * as Errors from "../../common/errors";
import { DISPLAYNAME_PREFIX } from "../../common/props";
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
var Portal = /** @class */ (function (_super) {
    __extends(Portal, _super);
    function Portal() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.context = {};
        _this.state = { hasMounted: false };
        _this.portalElement = null;
        return _this;
    }
    Portal.prototype.render = function () {
        // Only render `children` once this component has mounted in a browser environment, so they are
        // immediately attached to the DOM tree and can do DOM things like measuring or `autoFocus`.
        // See long comment on componentDidMount in https://reactjs.org/docs/portals.html#event-bubbling-through-portals
        if (typeof document === "undefined" || !this.state.hasMounted || this.portalElement === null) {
            return null;
        }
        else {
            return ReactDOM.createPortal(this.props.children, this.portalElement);
        }
    };
    Portal.prototype.componentDidMount = function () {
        if (this.props.container == null) {
            return;
        }
        this.portalElement = this.createContainerElement();
        this.props.container.appendChild(this.portalElement);
        /* eslint-disable-next-line react/no-did-mount-set-state */
        this.setState({ hasMounted: true }, this.props.onChildrenMount);
    };
    Portal.prototype.componentDidUpdate = function (prevProps) {
        // update className prop on portal DOM element
        if (this.portalElement != null && prevProps.className !== this.props.className) {
            maybeRemoveClass(this.portalElement.classList, prevProps.className);
            maybeAddClass(this.portalElement.classList, this.props.className);
        }
    };
    Portal.prototype.componentWillUnmount = function () {
        var _a;
        (_a = this.portalElement) === null || _a === void 0 ? void 0 : _a.remove();
    };
    Portal.prototype.createContainerElement = function () {
        var container = document.createElement("div");
        container.classList.add(Classes.PORTAL);
        maybeAddClass(container.classList, this.props.className);
        if (this.context != null) {
            maybeAddClass(container.classList, this.context.blueprintPortalClassName);
        }
        return container;
    };
    Portal.displayName = "".concat(DISPLAYNAME_PREFIX, ".Portal");
    Portal.contextTypes = REACT_CONTEXT_TYPES;
    Portal.defaultProps = {
        container: typeof document !== "undefined" ? document.body : undefined,
    };
    return Portal;
}(React.Component));
export { Portal };
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
//# sourceMappingURL=portal.js.map