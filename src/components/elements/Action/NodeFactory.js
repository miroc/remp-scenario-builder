import * as React from 'react';
import { AbstractNodeFactory } from 'storm-react-diagrams';

import NodeWidget from './NodeWidget';
import { NodeModel } from './NodeModel';

export class NodeFactory extends AbstractNodeFactory {
  constructor() {
    super('action');
  }

  generateReactWidget(diagramEngine, node) {
    return (
      <NodeWidget
        diagramEngine={diagramEngine}
        node={node}
        classBaseName='square-node'
        className='action-node'
      />
    );
  }

  getNewInstance() {
    return new NodeModel();
  }
}
