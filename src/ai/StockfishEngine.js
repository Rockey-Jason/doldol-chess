class StockfishEngine {

    constructor(){

        this.engine = new Worker("/stockfish/stockfish-18-lite-single.js");

        this.ready = false;

        this.queue = [];

        this.engine.onmessage = (e)=>{

            const msg = e.data;

            console.log("SF >", msg);

            if(msg === "uciok"){

                this.engine.postMessage("isready");

            }

            if(msg === "readyok"){

                this.ready = true;

                while(this.queue.length){

                    this.engine.postMessage(

                        this.queue.shift()

                    );

                }

            }

            if(this.callback){

                this.callback(msg);

            }

        };

        this.engine.postMessage("uci");

    }

    send(command){

        if(this.ready){

            this.engine.postMessage(command);

        }else{

            this.queue.push(command);

        }

    }

    onMessage(callback){

        this.callback = callback;

    }

}

export default StockfishEngine;