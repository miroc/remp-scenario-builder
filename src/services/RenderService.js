import flatMap from 'lodash/flatMap';

// import the custom models
import { Email, Segment, Trigger, Wait, Goal } from './../components/elements';

function minutesToTimeUnit(minutes) {
  if (minutes % 1440 === 0) {
    return {
      unit: 'days',
      time: minutes / 1440 
    };
  } else if (minutes % 60 === 0) {
    return {
      unit: 'hours',
      time: minutes / 60 
    };
  }
  return {
    unit: 'minutes',
    time: minutes
  };
}

export class RenderService {
  constructor(activeModel, payload = {}) {
    this.activeModel = activeModel;
    this.payload = payload;
  }

  renderPayload(payload) {
    this.payload = payload;

    flatMap(payload.triggers, trigger => {
      const triggerVisual = payload.visual[trigger.id];
      // trigger.type = "trigger";

      return this.renderElements(trigger, triggerVisual);
    });
  }

  renderElements(element, visual) {
    let nodes = [];
    let node = null;

    if (element.type === 'event') {
      element.selectedTrigger = element.event.code;
      node = new Trigger.NodeModel(element);

      nodes = element.elements.flatMap(elementId => {
        const element = this.payload.elements[elementId];
        const visual = this.payload.visual[element.id];

        const nextNodes = this.renderElements(element, visual);
        const link = node.getPort('right').link(nextNodes[0].getPort('left')); //FIXME/REFACTOR: nextNodes[0] is the last added node, it works, but it's messy

        this.activeModel.addLink(link);

        return nextNodes;
      });
    } else if (element.type === 'email') {
      element.selectedMail = element.email.code;
      node = new Email.NodeModel(element);

      nodes = element.email.descendants.flatMap(descendantObj => {
        const element = this.payload.elements[descendantObj.uuid];
        const visual = this.payload.visual[element.id];

        const nextNodes = this.renderElements(element, visual);
        const link = node.getPort('right').link(nextNodes[0].getPort('left'));

        this.activeModel.addLink(link);

        return nextNodes;
      });
    } else if (element.type === 'segment') {
      element.selectedSegment = element.segment.code;
      node = new Segment.NodeModel(element);

      nodes = element.segment.descendants.flatMap(descendantObj => {
        const element = this.payload.elements[descendantObj.uuid];
        const visual = this.payload.visual[element.id];

        const nextNodes = this.renderElements(element, visual);

        if (
          descendantObj.segment &&
          descendantObj.segment.direction === 'positive'
        ) {
          const link = node.getPort('right').link(nextNodes[0].getPort('left'));
          this.activeModel.addLink(link);
        } else if (
          descendantObj.segment &&
          descendantObj.segment.direction === 'negative'
        ) {
          const link = node
            .getPort('bottom')
            .link(nextNodes[0].getPort('left'));
          this.activeModel.addLink(link);
        }

        return nextNodes;
      });
    } else if (element.type === 'wait') {
      const timeUnit = minutesToTimeUnit(element.wait.minutes);
      element.waitingUnit = timeUnit.unit;
      element.waitingTime = timeUnit.time;

      node = new Wait.NodeModel(element);

      nodes = element.wait.descendants.flatMap(descendantObj => {
        const element = this.payload.elements[descendantObj.uuid];
        const visual = this.payload.visual[element.id];

        const nextNodes = this.renderElements(element, visual);
        const link = node.getPort('right').link(nextNodes[0].getPort('left'));
        this.activeModel.addLink(link);

        return nextNodes;
      });
    } else if (element.type === 'goal') {
      if (element.goal.hasOwnProperty("timeoutMinutes")) {
        const timeUnit = minutesToTimeUnit(element.goal.timeoutMinutes);
        element.timeoutUnit = timeUnit.unit;
        element.timeoutTime = timeUnit.time;
      }

      const recheckPeriodTimeUnit = minutesToTimeUnit(element.goal.recheckPeriodMinutes);
      element.recheckPeriodUnit = recheckPeriodTimeUnit.unit;
      element.recheckPeriodTime = recheckPeriodTimeUnit.time;

      element.selectedGoals = element.goal.codes;
      node = new Goal.NodeModel(element);

      nodes = element.goal.descendants.flatMap(descendantObj => {
        const element = this.payload.elements[descendantObj.uuid];
        const visual = this.payload.visual[element.id];

        const nextNodes = this.renderElements(element, visual);

        if (
          descendantObj.segment &&
          descendantObj.segment.direction === 'positive'
        ) {
          const link = node.getPort('right').link(nextNodes[0].getPort('left'));
          this.activeModel.addLink(link);
        } else if (
          descendantObj.segment &&
          descendantObj.segment.direction === 'negative'
        ) {
          const link = node
            .getPort('bottom')
            .link(nextNodes[0].getPort('left'));
          this.activeModel.addLink(link);
        }

        return nextNodes;
      });
    }

    this.activeModel.addNode(node);
    node.setPosition(visual.x, visual.y);

    return [node, ...nodes];
  }
}
