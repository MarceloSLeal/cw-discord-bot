const { Command } = require('discord.js-commando');
const plotly = require('plotly')(process.env.PLOTLY_USER,process.env.PLOTLY_PASS);
const dateFormat = require('dateformat');

const errorMessage = require("../../modules/errorMessage.js");
const mongoConnection = require("../../modules/mongoConnection");
const utils = require("../../modules/utils");

const UP = "⬆";
const DOWN = "⬇";
const EQUAL = "⬌";
let startGraphDate, endGraphDate;

module.exports = class GraphCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'cwgrafico',
            group: 'graph',
            memberName: 'graph',
            description: 'Verify CW Graph'
        });
    }

    async run(msg, args) {
        msg.channel.send(":arrows_counterclockwise: Aguarde, o gráfico está sendo gerado...");
        const inicialDate = new Date();
        inicialDate.setDate(inicialDate.getDate() - 10);
        inicialDate.setUTCHours(0, 0, 0, 0);
        const query = {_id : { "$gte" : inicialDate }, wingName: 'Cobra Wing' };
        
        mongoConnection.find(query, "wingData", function(error, results){
            if (error) {
                console.log('error:', error);
                return errorMessage.sendClientErrorMessage(msg);
            }
            const data = normalizeObjects(results);
            const graphOptions = {
                fileopt : "overwrite", 
                filename : "cwgraph",
                style: {
                    type: "scatter"
                },
                layout: {
                    title: "Gráfico de influências da Cobra Wing, período: " + 
                        dateFormat(startGraphDate, "dd/mm/yyyy") +
                        " à " + dateFormat(endGraphDate, "dd/mm/yyyy") + " UTC",
                    legend: {
                        font: {
                            size: 12
                        },
                        borderwidth: 1
                    },
                    xaxis: {
                        title: "Informações atualizadas pela última vez às " + 
                                dateFormat(endGraphDate, "HH:MM") + " UTC",
                        tickformat: "%d/%m",
                        type: "date",
                        autorange: true,
                        range: [
                            "2017-07-01",
                            "2017-07-10"
                        ]
                    },
                    yaxis: {
                        ticksuffix: " %",
                        tickmode: "linear",
                        dtick: 10,
                        range: [
                            -1,
                            101
                        ],
                        type: "linear",
                        autorange: false
                    }
                }
            };
            
            plotly.plot(data, graphOptions, function (err, res) {
                if (error) {
                    console.log('error:', error);
                    return errorMessage.sendClientErrorMessage(msg);
                }
                msg.channel.send("", {
                    file: res.url + ".png"
                });
            });
        });

        function normalizeObjects(results) {
            const map = [];
            let count = 0;
            const lastButOneInfluence = [];
            for(let result of results) {
                count = count+1;
                const date = result._id;
                for(let info of result.infos) {
                    const influence = info.influence;
                    if (map[info.systemName] == null) {
                        startGraphDate = utils.getUTCDate(date);
                        map[info.systemName] = {
                            influence: influence,
                            name: info.systemName,
                            y: [
                                influence
                            ],
                            x: [
                                date
                            ],
                            marker: {
                                size: 8
                            },
                            mode: "lines+markers",
                            line: {
                                shape: "linear"
                            },
                            type: "scatter"
                        };
                    } else {
                        endGraphDate = utils.getUTCDate(result.lastUpdate);
                        map[info.systemName].influence = influence;
                        map[info.systemName].y.push(influence);
                        map[info.systemName].x.push(date);
                        if (count > 1) {
                            var name = " " + utils.lpad(influence, 6) + utils.rpad("%", 4) + info.systemName;
                            var signal = EQUAL;
                            if (lastButOneInfluence[info.systemName] > influence) {
                                signal = DOWN;
                            } else if (lastButOneInfluence[info.systemName] < influence) {
                                signal = UP;
                            }
                            map[info.systemName].name = signal + name;
                        }
                        lastButOneInfluence[info.systemName] = influence;
                    }
                }
            }
            let resultNormalized = [];
            for (let key in map) {
                resultNormalized.push(map[key]);
            }
            resultNormalized.sort(sortFunction);
            return resultNormalized;
        }

        function sortFunction(a, b) {
            if (a.influence === b.influence) {
                return 0;
            } else {
                return (a.influence > b.influence) ? -1 : 1;
            }
        }
    }
}    