import { createMachine, assign, ActorRefFrom, sendParent } from 'xstate';
import { SimulationStatus, AlertType, AlertLevel, AlertThresholds } from '../types';

export interface SimulationMachineContext {
  taskId: string;
  progress: number;
  currentStage: number;
  error?: string;
  checkInterval?: number;
  thresholds: AlertThresholds;
  simulationTime: number;
  maxSimulationTime: number;
}

export type SimulationMachineEvents =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RETRY' }
  | { type: 'CANCEL' }
  | { type: 'TICK' }
  | { type: 'VALIDATION_PASS' }
  | { type: 'VALIDATION_FAIL'; error: string }
  | { type: 'MESHING_COMPLETE' }
  | { type: 'MESHING_FAIL'; error: string }
  | { type: 'FLOW_SIMULATION_COMPLETE' }
  | { type: 'FLOW_SIMULATION_FAIL'; error: string }
  | { type: 'MASS_TRANSFER_COMPLETE' }
  | { type: 'MASS_TRANSFER_FAIL'; error: string }
  | { type: 'EFFICIENCY_COMPLETE' }
  | { type: 'EFFICIENCY_FAIL'; error: string }
  | { type: 'ALERT_TRIGGERED'; alert: { type: AlertType; level: AlertLevel; message: string; stage: number } }
  | { type: 'ADJUST_PARAMS'; params: { stirringSpeed?: number; phaseRatio?: number } }
  | { type: 'ABNORMAL_DETECTED'; reason: string };

export const createSimulationMachine = (
  taskId: string,
  thresholds: AlertThresholds,
  maxSimulationTime: number = 100
) => {
  return createMachine<SimulationMachineContext, SimulationMachineEvents>(
    {
      id: 'simulation',
      initial: 'idle',
      context: {
        taskId,
        progress: 0,
        currentStage: 0,
        thresholds,
        simulationTime: 0,
        maxSimulationTime
      },
      states: {
        idle: {
          on: {
            START: 'pendingVerification'
          }
        },
        pendingVerification: {
          entry: [
            assign({ progress: 5, currentStage: 1 }),
            sendParent((ctx) => ({ type: 'STATUS_UPDATE', taskId: ctx.taskId, status: SimulationStatus.PENDING_VERIFICATION }))
          ],
          after: {
            2000: { target: 'validationCheck' }
          },
          on: {
            CANCEL: 'cancelled'
          }
        },
        validationCheck: {
          entry: sendParent((ctx) => ({ type: 'LOG', taskId: ctx.taskId, message: '开始参数校验...' })),
          invoke: {
            src: 'validateParams',
            onDone: 'meshing',
            onError: {
              target: 'abnormalRollback',
              actions: assign({ error: (_, event: any) => event.data.message })
            }
          },
          on: {
            VALIDATION_PASS: 'meshing',
            VALIDATION_FAIL: {
              target: 'abnormalRollback',
              actions: assign({ error: (_, event) => event.error })
            },
            CANCEL: 'cancelled'
          }
        },
        meshing: {
          entry: [
            assign({ progress: 20, currentStage: 2 }),
            sendParent((ctx) => ({ type: 'STATUS_UPDATE', taskId: ctx.taskId, status: SimulationStatus.MESHING }))
          ],
          invoke: {
            src: 'generateMesh',
            onDone: {
              target: 'twoPhaseFlow',
              actions: assign({ progress: 35 })
            },
            onError: {
              target: 'abnormalRollback',
              actions: assign({ error: (_, event: any) => event.data.message })
            }
          },
          on: {
            TICK: {
              actions: assign({
                progress: (ctx) => Math.min(35, ctx.progress + Math.random() * 3)
              })
            },
            MESHING_COMPLETE: {
              target: 'twoPhaseFlow',
              actions: assign({ progress: 35 })
            },
            MESHING_FAIL: {
              target: 'abnormalRollback',
              actions: assign({ error: (_, event) => event.error })
            },
            CANCEL: 'cancelled',
            PAUSE: 'paused'
          }
        },
        twoPhaseFlow: {
          entry: [
            assign({ progress: 40, currentStage: 3 }),
            sendParent((ctx) => ({ type: 'STATUS_UPDATE', taskId: ctx.taskId, status: SimulationStatus.TWO_PHASE_FLOW }))
          ],
          invoke: {
            src: 'simulateTwoPhaseFlow',
            onDone: {
              target: 'massTransfer',
              actions: assign({ progress: 60 })
            },
            onError: {
              target: 'checkAlert',
              actions: assign({ error: (_, event: any) => event.data.message })
            }
          },
          on: {
            TICK: {
              actions: [
                assign({
                  progress: (ctx) => Math.min(60, ctx.progress + Math.random() * 2),
                  simulationTime: (ctx) => Math.min(ctx.maxSimulationTime, ctx.simulationTime + 0.1)
                }),
                sendParent((ctx) => ({ type: 'MONITORING_UPDATE', taskId: ctx.taskId, time: ctx.simulationTime }))
              ]
            },
            FLOW_SIMULATION_COMPLETE: {
              target: 'massTransfer',
              actions: assign({ progress: 60 })
            },
            FLOW_SIMULATION_FAIL: {
              target: 'checkAlert',
              actions: assign({ error: (_, event) => event.error })
            },
            ALERT_TRIGGERED: {
              actions: sendParent((_, event) => ({
                type: 'ALERT',
                taskId: event.alert.stage ? '' : '',
                alert: event.alert
              }))
            },
            ADJUST_PARAMS: {
              actions: [
                sendParent((_, event) => ({ type: 'PARAMS_ADJUSTED', taskId, params: event.params })),
                assign({ progress: 38 })
              ],
              target: 'twoPhaseFlow'
            },
            CANCEL: 'cancelled',
            PAUSE: 'paused'
          }
        },
        massTransfer: {
          entry: [
            assign({ progress: 65, currentStage: 4 }),
            sendParent((ctx) => ({ type: 'STATUS_UPDATE', taskId: ctx.taskId, status: SimulationStatus.MASS_TRANSFER }))
          ],
          invoke: {
            src: 'simulateMassTransfer',
            onDone: {
              target: 'efficiencyEvaluation',
              actions: assign({ progress: 80 })
            },
            onError: {
              target: 'checkAlert',
              actions: assign({ error: (_, event: any) => event.data.message })
            }
          },
          on: {
            TICK: {
              actions: [
                assign({
                  progress: (ctx) => Math.min(80, ctx.progress + Math.random() * 1.5),
                  simulationTime: (ctx) => Math.min(ctx.maxSimulationTime, ctx.simulationTime + 0.1)
                }),
                sendParent((ctx) => ({ type: 'MONITORING_UPDATE', taskId: ctx.taskId, time: ctx.simulationTime }))
              ]
            },
            MASS_TRANSFER_COMPLETE: {
              target: 'efficiencyEvaluation',
              actions: assign({ progress: 80 })
            },
            MASS_TRANSFER_FAIL: {
              target: 'checkAlert',
              actions: assign({ error: (_, event) => event.error })
            },
            ALERT_TRIGGERED: {
              actions: sendParent((_, event) => ({
                type: 'ALERT',
                alert: event.alert
              }))
            },
            ADJUST_PARAMS: {
              actions: [
                sendParent((_, event) => ({ type: 'PARAMS_ADJUSTED', taskId, params: event.params })),
                assign({ progress: 63 })
              ],
              target: 'massTransfer'
            },
            CANCEL: 'cancelled',
            PAUSE: 'paused'
          }
        },
        efficiencyEvaluation: {
          entry: [
            assign({ progress: 85, currentStage: 5 }),
            sendParent((ctx) => ({ type: 'STATUS_UPDATE', taskId: ctx.taskId, status: SimulationStatus.EFFICIENCY_EVALUATION }))
          ],
          invoke: {
            src: 'evaluateEfficiency',
            onDone: {
              target: 'completed',
              actions: assign({ progress: 100 })
            },
            onError: {
              target: 'checkAlert',
              actions: assign({ error: (_, event: any) => event.data.message })
            }
          },
          on: {
            TICK: {
              actions: assign({
                progress: (ctx) => Math.min(100, ctx.progress + Math.random() * 3)
              })
            },
            EFFICIENCY_COMPLETE: {
              target: 'completed',
              actions: assign({ progress: 100 })
            },
            EFFICIENCY_FAIL: {
              target: 'checkAlert',
              actions: assign({ error: (_, event) => event.error })
            },
            CANCEL: 'cancelled'
          }
        },
        checkAlert: {
          entry: sendParent((ctx) => ({ type: 'CHECK_ALERT', taskId: ctx.taskId })),
          on: {
            ABNORMAL_DETECTED: {
              target: 'abnormalRollback',
              actions: assign({ error: (_, event) => event.reason })
            },
            RETRY: 'twoPhaseFlow',
            ADJUST_PARAMS: {
              actions: [
                sendParent((_, event) => ({ type: 'PARAMS_ADJUSTED', taskId, params: event.params })),
                assign({ progress: 38, error: undefined })
              ],
              target: 'twoPhaseFlow'
            }
          }
        },
        abnormalRollback: {
          entry: [
            sendParent((ctx) => ({ type: 'STATUS_UPDATE', taskId: ctx.taskId, status: SimulationStatus.ABNORMAL_ROLLBACK })),
            sendParent((ctx) => ({ type: 'ERROR', taskId: ctx.taskId, error: ctx.error }))
          ],
          on: {
            RETRY: 'pendingVerification',
            ADJUST_PARAMS: {
              actions: [
                sendParent((_, event) => ({ type: 'PARAMS_ADJUSTED', taskId, params: event.params })),
                assign({ error: undefined, progress: 5 })
              ],
              target: 'pendingVerification'
            }
          }
        },
        paused: {
          entry: sendParent((ctx) => ({ type: 'STATUS_UPDATE', taskId: ctx.taskId, status: SimulationStatus.PAUSED })),
          on: {
            RESUME: [
              { target: 'meshing', cond: 'isMeshingStage' },
              { target: 'twoPhaseFlow', cond: 'isFlowStage' },
              { target: 'massTransfer', cond: 'isMassTransferStage' },
              { target: 'efficiencyEvaluation', cond: 'isEfficiencyStage' }
            ],
            CANCEL: 'cancelled'
          }
        },
        completed: {
          entry: [
            assign({ progress: 100 }),
            sendParent((ctx) => ({ type: 'STATUS_UPDATE', taskId: ctx.taskId, status: SimulationStatus.COMPLETED })),
            sendParent((ctx) => ({ type: 'COMPLETE', taskId: ctx.taskId }))
          ],
          type: 'final'
        },
        cancelled: {
          type: 'final'
        }
      }
    },
    {
      guards: {
        isMeshingStage: (ctx) => ctx.currentStage === 2,
        isFlowStage: (ctx) => ctx.currentStage === 3,
        isMassTransferStage: (ctx) => ctx.currentStage === 4,
        isEfficiencyStage: (ctx) => ctx.currentStage === 5
      },
      services: {
        validateParams: async () => {
          await new Promise(resolve => setTimeout(resolve, 1500));
          return true;
        },
        generateMesh: async () => {
          await new Promise(resolve => setTimeout(resolve, 3000));
          return { nodeCount: 125842, elementCount: 452316 };
        },
        simulateTwoPhaseFlow: async () => {
          await new Promise(resolve => setTimeout(resolve, 5000));
          return { convergence: true, iterations: 456 };
        },
        simulateMassTransfer: async () => {
          await new Promise(resolve => setTimeout(resolve, 4000));
          return { convergence: true, massBalanceError: 0.0013 };
        },
        evaluateEfficiency: async () => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return {
            averageExtractionRate: 0.912,
            separationFactor: 2.78,
            stageEfficiencies: Array.from({ length: 10 }, () => 0.85 + Math.random() * 0.12)
          };
        }
      }
    }
  );
};

export type SimulationActorRef = ActorRefFrom<ReturnType<typeof createSimulationMachine>>;
