// Copyright (c) 2016 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/*
  Example config for GraphView component
*/
import React from "react";

const EmptyShape = (
  <symbol viewBox="0 0 100 100" id="Empty">
    <circle cx="50" cy="50" r="45" />
  </symbol>
);

const SpecialShape = (
  <symbol viewBox="0 0 100 100" id="Special">
    <rect transform="translate(50) rotate(45)" width="70" height="70" />
  </symbol>
);

const SpecialChildShape = (
  <symbol viewBox="0 0 100 100" id="SpecialChild">
    <rect
      x="2.5"
      y="0"
      width="95"
      height="97.5"
      fill="rgba(30, 144, 255, 0.12)"
    />
  </symbol>
);

const EmptyEdgeShape = (
  <symbol viewBox="0 0 50 50" id="EmptyEdge">
    <circle cx="25" cy="25" r="8" fill="currentColor">
      {" "}
    </circle>
  </symbol>
);

const SpecialEdgeShape = (
  <symbol viewBox="0 0 50 50" id="SpecialEdge">
    <rect
      transform="rotate(45)"
      x="25"
      y="-4.5"
      width="15"
      height="15"
      fill="currentColor"
    />
  </symbol>
);

export default {
  NodeTypes: {
    Empty: {
      typeText: "None",
      shapeId: "#Empty",
      shape: EmptyShape
    },
    Special: {
      typeText: "Special",
      shapeId: "#Special",
      shape: SpecialShape
    }
  },
  NodeSubtypes: {
    SpecialChild: {
      shapeId: "#SpecialChild",
      shape: SpecialChildShape
    }
  },
  EdgeTypes: {
    EmptyEdge: {
      shapeId: "#EmptyEdge",
      shape: EmptyEdgeShape
    },
    SpecialEdge: {
      shapeId: "#SpecialEdge",
      shape: SpecialEdgeShape
    }
  }
};
