import Agenda, { Job } from "agenda";

import config from "@app/config";
import { Jobs } from "./jobs";
import { EJOBS } from "@app/types";

export let agenda: Agenda;

export const connectAgenda = async () => {
  agenda = new Agenda({ db: { address: config.DB_PATH } });
  await agenda.start();

  Jobs.forEach((job) => {
    agenda.define(job.name, job.options, async (agendaJob: Job, done) => {
      try {
        await job.processor(agendaJob, done);
        done();
        await agendaJob.save();
      } catch (err) {
        agendaJob.fail(err);
        await agendaJob.save();
      }
    });
  });
};

export const scheduleJob = async <T>(
  when: string | Date,
  name: EJOBS,
  data?: T
) => {
  await agenda.schedule(when, name, data);
};
