/*##############################################################################
#    HPCC SYSTEMS software Copyright (C) 2012 HPCC Systems.
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
############################################################################## */
define([
    "dojo/_base/lang",
    "dojo/_base/fx",
    "dojo/_base/window",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/dom-geometry",
    "dojo/io-query",
    "dojo/topic",
    "dojo/ready",

    "dojox/widget/Toaster",
    "dojox/widget/Standby"
], function (lang, fx, baseWindow, dom, domStyle, domGeometry, ioQuery, topic, ready,
        Toaster, Standby) {

    var initUi = function () {
        var params = ioQuery.queryToObject(dojo.doc.location.search.substr((dojo.doc.location.search.substr(0, 1) == "?" ? 1 : 0)));

        require(
            ["hpcc/" + params.Widget],
            function (WidgetClass) {
                var webParams = {
                    id: "stub",
                    "class": "hpccApp"
                };
                if (params.TabPosition) {
                    lang.mixin(webParams, {
                        TabPosition: params.TabPosition
                    });
                }
                if (params.ReadOnly) {
                    lang.mixin(webParams, {
                        readOnly: params.ReadOnly
                    });
                }
                var widget = WidgetClass.fixCircularDependency ? new WidgetClass.fixCircularDependency(webParams) : new WidgetClass(webParams);

                var standbyBackground = new Standby({
                    color: "#FAFAFA",
                    text: "",
                    centerIndicator: "text",
                    target: "stub"
                });
                dojo.body().appendChild(standbyBackground.domNode);
                standbyBackground.startup();
                standbyBackground.hpccShowCount = 0;

                topic.subscribe("hpcc/standbyBackgroundShow", function () {
                    if (standbyBackground.hpccShowCount++ == 0) {
                        standbyBackground.show();
                    }
                });

                topic.subscribe("hpcc/standbyBackgroundHide", function () {
                    if (--standbyBackground.hpccShowCount <= 0) {
                        standbyBackground.hpccShowCount = 0;
                        standbyBackground.hide();
                    }
                });

                var standbyForeground = new Standby({
                    zIndex: 1000,
                    target: "stub"
                });
                dojo.body().appendChild(standbyForeground.domNode);
                standbyForeground.startup();
                standbyForeground.hpccShowCount = 0;

                topic.subscribe("hpcc/standbyForegroundShow", function () {
                    standbyForeground.show();
                    ++standbyForeground.hpccShowCount;
                });

                topic.subscribe("hpcc/standbyForegroundHide", function () {
                    if (--standbyForeground.hpccShowCount <= 0) {
                        standbyForeground.hpccShowCount = 0;
                        standbyForeground.hide();
                    }
                });
                var myToaster = new Toaster({
                    id: 'hpcc_toaster',
                    positionDirection: 'br-left',
                    messageTopic: 'hpcc/brToaster'
                });

                if (widget) {
                    widget.placeAt(dojo.body(), "last");
                    widget.startup();
                    widget.init(params);
                }

                /*
                dojo.publish("hpccMessageTopic", {
                    type: "warning",
                    message:  "testing"
                });
                */
            }
        );
    },

    startLoading = function (targetNode) {
        var overlayNode = dom.byId("loadingOverlay");
        if ("none" == domStyle.get(overlayNode, "display")) {
            var coords = domGeometry.getMarginBox(targetNode || baseWindow.body());
            domGeometry.setMarginBox(overlayNode, coords);
            domStyle.set(dom.byId("loadingOverlay"), {
                display: "block",
                opacity: 1
            });
        }
    },

    endLoading = function () {
        fx.fadeOut({
            node: dom.byId("loadingOverlay"),
            duration: 175,
            onEnd: function (node) {
                domStyle.set(node, "display", "none");
            }
        }).play();
    };

    return {
        init: function () {
            startLoading();
            ready(function () {
                initUi();
                endLoading();
            });
        }
    };
});
