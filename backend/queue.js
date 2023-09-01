import { engineAnalysis} from "./analysis.js";

export default class Queue {
    constructor() {
      this.queue = [];
      this.processing = false;
    }
  
    async process(server, game, move, ai) {
      this.queue.push({ server, game, move, ai });
      if (!this.processing) this.processNext();
    }
  
    async processNext() {
      if (this.queue.length === 0) {
        this.processing = false;
        return;
      }
  
      this.processing = true;
      const { server, game, move, ai } = this.queue.shift();
      try {
        await engineAnalysis(server, game, move, ai);
      } catch (error) {
        console.error('Error processing query:', error);
      }
      this.processNext();
    }
  }
  