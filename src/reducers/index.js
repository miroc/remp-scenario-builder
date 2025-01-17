import { combineReducers } from 'redux';
import SegmentsReducer from './SegmentsReducer';
import TriggersReducer from './TriggersReducer';
import CanvasReducer from './CanvasReducer';
import ScenarioReducer from './ScenarioReducer';
import MailsReducer from './MailsReducer';
import GoalsReducer from './GoalsReducer';

export default combineReducers({
  segments: SegmentsReducer,
  triggers: TriggersReducer,
  canvas: CanvasReducer,
  scenario: ScenarioReducer,
  mails: MailsReducer,
  goals: GoalsReducer
});
