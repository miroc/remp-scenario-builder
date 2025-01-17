function unitTimeToMinutes(time, unit) {
  switch (unit) {
    case 'minutes':
      return time;
    case 'hours':
      return time * 60;
    case 'days':
      return time * 60 * 24;
    default:
      return time;
  }
}

export class ExportService {
  constructor(model) {
    this.model = model;
  }

  exportPayload() {
    const payload = {};
    const serializedModel = this.model.serializeDiagram();

    payload.triggers = {};
    payload.elements = {};
    payload.visual = {};

    serializedModel.nodes
      .filter(node => node.type === 'trigger')
      .map(node => (payload.triggers[node.id] = this.formatNode(node)));

    Object.entries(this.model.getNodes()).forEach(node => {
      payload.visual[node[0]] = {
        x: node[1].x,
        y: node[1].y
      };
    });

    Object.entries(this.model.getNodes()).forEach(node => {
      if (node[1].type !== 'trigger') {
        payload.elements[node[0]] = this.formatNode(node[1].serialize());
      }
    });

    return payload;
  }

  getAllChildrenNodes(node, portName = 'right') {
    const port = node.ports.find(port => port.name === portName);

    return port.links.map(link => {
      let nextNode = null;

      if (this.model.links[link].targetPort.parent.id !== node.id) {
        nextNode = this.model.links[link].targetPort.parent;
      } else {
        nextNode = this.model.links[link].sourcePort.parent;
      }

      // return this.formatNode(nextNode.serialize(), model);
      return { ...nextNode.serialize(), portName };
    });
  }

  formatNode(node) {
    console.log(node.type);
    if (node.type === 'email') {
      return {
        id: node.id,
        name: node.name ? node.name : '',
        type: 'email',
        email: {
          code: node.selectedMail,
          descendants: this.getAllChildrenNodes(node).map(descendantNode =>
            this.formatDescendant(descendantNode, node)
          )
        }
      };
    } else if (node.type === 'segment') {
      const descendantsPositive = this.getAllChildrenNodes(node, 'right').map(
        descendantNode => this.formatDescendant(descendantNode, node)
      );
      const descendantsNegative = this.getAllChildrenNodes(node, 'bottom').map(
        descendantNode => this.formatDescendant(descendantNode, node)
      );
      return {
        id: node.id,
        name: node.name ? node.name : '',
        type: 'segment',
        segment: {
          code: node.selectedSegment ? node.selectedSegment : 'all_users',
          descendants: [...descendantsPositive, ...descendantsNegative]
        }
      };
    } else if (node.type === 'trigger') {
      return {
        id: node.id,
        name: node.name ? node.name : '',
        type: 'event',
        event: {
          code: node.selectedTrigger ? node.selectedTrigger : 'user_created'
        },
        // elements: this.getAllChildrenNodes(node).map((descendantNode) => this.formatDescendant(descendantNode, node))
        elements: this.getAllChildrenNodes(node).map(
          descendantNode => descendantNode.id
        )
      };
    } else if (node.type === 'wait') {
      return {
        id: node.id,
        name: node.name ? node.name : '',
        type: 'wait',
        wait: {
          minutes: unitTimeToMinutes(node.waitingTime, node.waitingUnit),
          descendants: this.getAllChildrenNodes(node).map(descendantNode =>
            this.formatDescendant(descendantNode, node)
          )
        }
      };
    } else if (node.type === 'goal') {
      const descendantsPositive = this.getAllChildrenNodes(node, 'right').map(
        descendantNode => this.formatDescendant(descendantNode, node)
      );
      const descendantsNegative = this.getAllChildrenNodes(node, 'bottom').map(
        descendantNode => this.formatDescendant(descendantNode, node)
      );

      let goalProperties = {
        codes: node.selectedGoals ? node.selectedGoals : [],
        descendants: [...descendantsPositive, ...descendantsNegative],
        recheckPeriodMinutes: unitTimeToMinutes(node.recheckPeriodTime, node.recheckPeriodUnit)
      };

      if (node.timeoutTime && node.timeoutUnit) {
        goalProperties.timeoutMinutes = unitTimeToMinutes(node.timeoutTime, node.timeoutUnit);
      }

      return {
        id: node.id,
        name: node.name ? node.name : '',
        type: 'goal',
        goal: goalProperties,
      };
    }
  }

  formatDescendant = (node, parentNode) => {
    let descendant = {
      uuid: node.id
    };

    if (parentNode.type === 'segment') {
      descendant.segment = {
        direction: node.portName === 'right' ? 'positive' : 'negative'
      };
    }

    return descendant;
  };
}
