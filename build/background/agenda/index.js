"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleJob = exports.connectAgenda = exports.agenda = void 0;
const agenda_1 = __importDefault(require("agenda"));
const config_1 = __importDefault(require("@app/config"));
const jobs_1 = require("./jobs");
const connectAgenda = async () => {
    exports.agenda = new agenda_1.default({ db: { address: config_1.default.DB_PATH } });
    await exports.agenda.start();
    jobs_1.Jobs.forEach((job) => {
        exports.agenda.define(job.name, job.options, async (agendaJob, done) => {
            try {
                await job.processor(agendaJob, done);
                done();
                await agendaJob.save();
            }
            catch (err) {
                agendaJob.fail(err);
                await agendaJob.save();
            }
        });
    });
};
exports.connectAgenda = connectAgenda;
const scheduleJob = async (when, name, data) => {
    await exports.agenda.schedule(when, name, data);
};
exports.scheduleJob = scheduleJob;
//# sourceMappingURL=index.js.map