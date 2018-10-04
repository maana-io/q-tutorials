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
  Example usage of GraphView component
*/

import React, { Component } from "react";
import gql from "graphql-tag";

import GraphView from "react-digraph";
import GraphConfig from "./graph-config.js"; // Configures node/edge types

const CREATE_VERTEX = gql`
  mutation createVertex(
    $graphId: ID!
    $x: Float!
    $y: Float!
    $title: String
    $type: VertexType
    $subtype: VertexSubtype
  ) {
    createVertex(
      graphId: $graphId
      x: $x
      y: $y
      title: $title
      type: $type
      subtype: $subtype
    ) {
      id
    }
  }
`;

const CREATE_EDGE = gql`
  mutation createEdge(
    $graphId: ID!
    $sourceVertexId: ID!
    $targetVertexId: ID!
    $title: String
    $type: EdgeType
  ) {
    createEdge(
      graphId: $graphId
      sourceVertexId: $sourceVertexId
      targetVertexId: $targetVertexId
      title: $title
      type: $type
    ) {
      id
    }
  }
`;

const styles = {
  graph: {
    height: "100%",
    width: "100%"
  }
};

const NODE_KEY = "id"; // Key used to identify nodes

// These keys are arbitrary (but must match the config)
// However, GraphView renders text differently for empty types
// so this has to be passed in if that behavior is desired.
const EMPTY_TYPE = "Empty"; // Empty node type
const SPECIAL_TYPE = "Special";
// const SPECIAL_CHILD_SUBTYPE = "SpecialChild";
const EMPTY_EDGE_TYPE = "EmptyEdge";
const SPECIAL_EDGE_TYPE = "SpecialEdge";

class Graph extends Component {
  constructor(props) {
    super(props);

    this.state = {
      graph: props.graph,
      selected: {}
    };
  }

  // Helper to find the index of a given node
  getNodeIndex(searchNode) {
    return this.state.graph.nodes.findIndex(node => {
      return node[NODE_KEY] === searchNode[NODE_KEY];
    });
  }

  // Helper to find the index of a given edge
  getEdgeIndex(searchEdge) {
    return this.state.graph.edges.findIndex(edge => {
      return (
        edge.source === searchEdge.source && edge.target === searchEdge.target
      );
    });
  }

  // Given a nodeKey, return the corresponding node
  getViewNode = nodeKey => {
    const searchNode = {};
    searchNode[NODE_KEY] = nodeKey;
    const i = this.getNodeIndex(searchNode);
    return this.state.graph.nodes[i];
  };

  /*
   * Handlers/Interaction
   */

  // Called by 'drag' handler, etc..
  // to sync updates from D3 with the graph
  onUpdateNode = viewNode => {
    const graph = this.state.graph;
    const i = this.getNodeIndex(viewNode);
    console.log("onUpdateNode", viewNode);
    graph.nodes[i] = viewNode;
    this.setState({ graph: graph });
  };

  // Node 'mouseUp' handler
  onSelectNode = viewNode => {
    // Deselect events will send Null viewNode
    if (!!viewNode) {
      this.setState({ selected: viewNode });
    } else {
      this.setState({ selected: {} });
    }
  };

  // Edge 'mouseUp' handler
  onSelectEdge = viewEdge => {
    console.log("onSelectEdge", viewEdge);
    this.setState({ selected: viewEdge });
  };

  // Updates the graph with a new node
  onCreateNode = async (x, y) => {
    const graph = this.state.graph;

    // This is just an example - any sort of logic
    // could be used here to determine node type
    // There is also support for subtypes. (see 'sample' above)
    // The subtype geometry will underlay the 'type' geometry for a node
    const type = Math.random() < 0.25 ? SPECIAL_TYPE : EMPTY_TYPE;

    const viewNode = {
      title: "",
      type: type,
      x: x,
      y: y
    };

    const result = await this.props.client.mutate({
      mutation: CREATE_VERTEX,
      variables: {
        graphId: this.props.graph.id,
        ...viewNode
      }
    });
    // @@TODO: handle errors
    viewNode["id"] = result.data.createVertex.id;

    graph.nodes.push(viewNode);
    this.setState({ graph: graph });
  };

  // Deletes a node from the graph
  onDeleteNode = viewNode => {
    const graph = this.state.graph;
    const i = this.getNodeIndex(viewNode);
    graph.nodes.splice(i, 1);

    // Delete any connected edges
    const newEdges = graph.edges.filter((edge, i) => {
      return (
        edge.source !== viewNode[NODE_KEY] && edge.target !== viewNode[NODE_KEY]
      );
    });

    graph.edges = newEdges;

    this.setState({ graph: graph, selected: {} });
  };

  // Creates a new node between two edges
  onCreateEdge = async (sourceViewNode, targetViewNode) => {
    const graph = this.state.graph;

    // This is just an example - any sort of logic
    // could be used here to determine edge type
    const type =
      sourceViewNode.type === SPECIAL_TYPE
        ? SPECIAL_EDGE_TYPE
        : EMPTY_EDGE_TYPE;

    const viewEdge = {
      source: sourceViewNode[NODE_KEY],
      target: targetViewNode[NODE_KEY],
      type: type
    };

    // Only add the edge when the source node is not the same as the target
    if (viewEdge.source !== viewEdge.target) {
      const result = await this.props.client.mutate({
        mutation: CREATE_EDGE,
        variables: {
          graphId: this.props.graph.id,
          sourceVertexId: viewEdge.source,
          targetVertexId: viewEdge.target,
          type: viewEdge.type
        }
      });
      // @@TODO: handle errors
      viewEdge["id"] = result.data.createEdge.id;

      graph.edges.push(viewEdge);
      this.setState({ graph: graph });
    }
  };

  // Called when an edge is reattached to a different target.
  onSwapEdge = (sourceViewNode, targetViewNode, viewEdge) => {
    const graph = this.state.graph;
    const i = this.getEdgeIndex(viewEdge);
    const edge = JSON.parse(JSON.stringify(graph.edges[i]));

    edge.source = sourceViewNode[NODE_KEY];
    edge.target = targetViewNode[NODE_KEY];
    graph.edges[i] = edge;

    this.setState({ graph: graph });
  };

  // Called when an edge is deleted
  onDeleteEdge = viewEdge => {
    const graph = this.state.graph;
    const i = this.getEdgeIndex(viewEdge);
    graph.edges.splice(i, 1);
    this.setState({ graph: graph, selected: {} });
  };

  /*
   * Render
   */

  render() {
    const nodes = this.state.graph.nodes.map(x => ({ ...x }));
    const edges = this.state.graph.edges;
    const selected = this.state.selected;

    const NodeTypes = GraphConfig.NodeTypes;
    const NodeSubtypes = GraphConfig.NodeSubtypes;
    const EdgeTypes = GraphConfig.EdgeTypes;

    return (
      <div id="graph" style={styles.graph}>
        <GraphView
          ref={el => (this.GraphView = el)}
          nodeKey={NODE_KEY}
          emptyType={EMPTY_TYPE}
          nodes={nodes}
          edges={edges}
          selected={selected}
          nodeTypes={NodeTypes}
          nodeSubtypes={NodeSubtypes}
          edgeTypes={EdgeTypes}
          enableFocus={true}
          getViewNode={this.getViewNode}
          onSelectNode={this.onSelectNode}
          onCreateNode={this.onCreateNode}
          onUpdateNode={this.onUpdateNode}
          onDeleteNode={this.onDeleteNode}
          onSelectEdge={this.onSelectEdge}
          onCreateEdge={this.onCreateEdge}
          onSwapEdge={this.onSwapEdge}
          onDeleteEdge={this.onDeleteEdge}
        />
      </div>
    );
  }
}

export default Graph;
