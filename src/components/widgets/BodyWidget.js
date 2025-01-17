import * as React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import compose from 'recompose/compose';
import { DiagramWidget } from 'storm-react-diagrams';
import Button from '@material-ui/core/Button';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import ActionIcon from '@material-ui/icons/Mail';
import TriggerIcon from '@material-ui/icons/Notifications';
import WaitIcon from '@material-ui/icons/AccessAlarmsOutlined';
import SegmentIcon from '@material-ui/icons/SubdirectoryArrowRight';
import GoalIcon from '@material-ui/icons/CheckBox';

import * as config from './../../config';
import { TrayItemWidget } from './TrayItemWidget';
import { ExportService } from './../../services/ExportService';
import Notification from '../Notification';
import { Email, Segment, Trigger, Wait, Goal } from './../elements';
import {
  setScenarioId,
  setScenarioName,
  setCanvasNotification,
  setScenarioLoading
} from '../../actions';

const drawerWidth = 240;

const styles = theme => ({
  root: {
    display: 'flex'
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0
  },
  drawerPaper: {
    width: drawerWidth
  },
  content: {
    flexGrow: 1,
    padding: 0
  },
  toolbar: theme.mixins.toolbar
});

class BodyWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editingName: false,
      editedName: ''
    };
  }

  saveChanges = () => {
    const { dispatch } = this.props;

    const exportService = new ExportService(
      this.props.app.getDiagramEngine().getDiagramModel()
    );

    const payload = {
      name: this.props.scenario.name,
      ...exportService.exportPayload()
    };

    const scenarioId = this.props.scenario.id;
    if (scenarioId) {
      payload.id = scenarioId;
    }

    dispatch(setScenarioLoading(true));

    axios
      .post(`${config.URL_SCENARIO_CREATE}`, payload)
      .then(response => {
        dispatch(setScenarioId(response.data.id));
        dispatch(setScenarioLoading(false));
        dispatch(
          setCanvasNotification({
            open: true,
            variant: 'success',
            text: 'Scenario saving succeeded.'
          })
        );
      })
      .catch(error => {
        dispatch(setScenarioLoading(false));
        dispatch(
          setCanvasNotification({
            open: true,
            variant: 'error',
            text: 'Scenario saving failed.'
          })
        );
        console.log(error);
      });
  };

  startEditingName = () => {
    this.setState({
      editedName: this.props.scenario.name,
      editingName: true
    });
  };

  cancelEditingName = () => {
    this.setState({
      editedName: '',
      editingName: false
    });
  };

  submitEditingName = () => {
    if (this.state.editedName.length === 0) {
      this.cancelEditingName();
      return;
    }

    this.props.dispatch(setScenarioName(this.state.editedName));
    this.setState({
      editedName: '',
      editingName: false
    });
  };

  handleCloseAndSaveDuringChangingName = event => {
    if (event.keyCode === 27) {
      this.cancelEditingName();
    } else if (event.keyCode === 13) {
      this.submitEditingName();
    }
  };

  handleNameTyping = event => {
    this.setState({
      editedName: event.target.value
    });
  };

  closeNotification = () => {
    this.props.dispatch(setCanvasNotification({ open: false }));
  };

  render() {
    const { classes, canvas } = this.props;

    const diagramProps = {
      className: 'srd-demo-canvas',
      diagramEngine: this.props.app.getDiagramEngine(),
      maxNumberPointsPerLink: 0,
      allowLooseLinks: false,
      allowCanvasTranslation: canvas.pannable,
      allowCanvasZoom: canvas.zoomable
    }; // as DiagramProps;

    return (
      <div className='body'>
        <div className={classes.root}>
          <CssBaseline />
          <AppBar position='fixed' className={classes.appBar}>
            <Toolbar>
              <Grid container>
                <Grid item xs={4}>
                  <Typography variant='h6' color='inherit' noWrap>
                    {this.state.editingName ? (
                      <input
                        autoFocus
                        type='text'
                        value={this.state.editedName}
                        onChange={this.handleNameTyping}
                        onKeyDown={this.handleCloseAndSaveDuringChangingName}
                        onBlur={this.cancelEditingName}
                        className='changing-name-input'
                      />
                    ) : (
                      <span
                        onClick={this.startEditingName}
                        className='scenario-name'
                      >
                        {this.props.scenario.name}
                      </span>
                    )}
                  </Typography>
                </Grid>

                <Grid item xs={8}>
                  <Grid container direction='row' justify='flex-end'>
                    {!!this.props.scenario.loading && (
                      <CircularProgress
                        className='circular-loading'
                        size={19}
                        color='inherit'
                      />
                    )}
                    <Button
                      size='small'
                      variant='contained'
                      color='secondary'
                      onClick={() => this.saveChanges()}
                    >
                      {this.props.scenario.id ? 'Update' : 'Save'}
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Toolbar>
          </AppBar>
          <Drawer
            className={classes.drawer}
            variant='permanent'
            classes={{
              paper: classes.drawerPaper
            }}
          >
            <div className={classes.toolbar} />
            <List
              component='nav'
              subheader={
                <ListSubheader component='div'>Triggers</ListSubheader>
              }
            >
              <TrayItemWidget
                model={{ type: 'trigger' }}
                name='Event'
                icon={<TriggerIcon />}
              />
            </List>

            <List
              component='nav'
              subheader={<ListSubheader component='div'>Actions</ListSubheader>}
            >
              <TrayItemWidget
                model={{ type: 'email' }}
                name='Send email'
                icon={<ActionIcon />}
              />
            </List>

            <List
              component='nav'
              subheader={
                <ListSubheader component='div'>Operations</ListSubheader>
              }
            >
              <TrayItemWidget
                model={{ type: 'segment' }}
                name='Segment'
                icon={<SegmentIcon />}
              />

              <TrayItemWidget
                model={{ type: 'wait' }}
                name='Wait'
                icon={<WaitIcon />}
              />

              <TrayItemWidget
                model={{ type: 'goal' }}
                name='Goal'
                icon={<GoalIcon />}
              />
            </List>
          </Drawer>
          <Notification
            variant={this.props.canvas.notification.variant}
            text={this.props.canvas.notification.text}
            open={this.props.canvas.notification.open}
            handleClose={this.closeNotification}
          />

          <main className={classes.content}>
            <div
              className='diagram-layer'
              onDrop={event => {
                const stormDiagramNode = event.dataTransfer.getData(
                  'storm-diagram-node'
                );
                if (!stormDiagramNode) return;
                var data = JSON.parse(stormDiagramNode);
                // var nodesCount = _.keys(
                //   this.props.app
                //     .getDiagramEngine()
                //     .getDiagramModel()
                //     .getNodes()
                // ).length;

                var node = null;
                if (data.type === 'email') {
                  node = new Email.NodeModel({});
                } else if (data.type === 'segment') {
                  node = new Segment.NodeModel({});
                } else if (data.type === 'trigger') {
                  node = new Trigger.NodeModel({});
                } else if (data.type === 'wait') {
                  node = new Wait.NodeModel({});
                } else if (data.type === 'goal') {
                  node = new Goal.NodeModel({
                    recheckPeriodUnit: 'hours',
                    recheckPeriodTime: 1,
                  });
                }
                var points = this.props.app
                  .getDiagramEngine()
                  .getRelativeMousePoint(event);
                node.x = points.x;
                node.y = points.y;
                this.props.app
                  .getDiagramEngine()
                  .getDiagramModel()
                  .addNode(node);
                this.forceUpdate();
              }}
              onDragOver={event => {
                event.preventDefault();
              }}
            >
              <DiagramWidget {...diagramProps} />
            </div>
          </main>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    canvas: state.canvas,
    scenario: state.scenario
  };
}

export default compose(
  withStyles(styles, { name: 'BodyWidget' }),
  connect(
    mapStateToProps,
    null
  )
)(BodyWidget);
