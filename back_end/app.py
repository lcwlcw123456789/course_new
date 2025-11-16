from flask import Flask, jsonify
from flask_cors import CORS

import json

app = Flask(__name__)
CORS(app)


@app.route("/line-chart", methods=['GET'])
def getLineChartData():
    data = None

    try:
        with open("./data/LineChart/vega_line.json", 'r') as file:
            data = json.load(file)
            # print(data)
            response = {"code": 200, "msg": "", "data": data}
            print(response)
        return jsonify(response)
    except IOError:
        print("Can't find the corresponding file")


@app.route("/pie-chart/<year>", methods=['GET'])
def getPieChartData(year):
    data = None

    try:
        with open(f"./data/PieChart/vega_pie_{year}.json", 'r') as file:
            data = json.load(file)
            # print(data)
            response = {"code": 200, "msg": "", "data": data}
            print(response)
        return jsonify(response)
    except IOError:
        print("Can't find the corresponding file")


@app.route("/treemap-chart/<year>", methods=['GET'])
def getTreemapChartData(year):
    data = None

    try:
        with open(f"./data/TreemapChart/vega_treemap_{year}.json",
                  'r') as file:
            data = json.load(file)
            # print(data)
            response = {"code": 200, "msg": "", "data": data}
            print(response)
        return jsonify(response)
    except IOError:
        print("Can't find the corresponding file")


@app.route("/world-chart/<year>/<category>", methods=['GET'])
def getWorldChartData(year, category):
    data = None

    try:
        with open(f"./data/WorldChart/vega_world_{year}_{category}.json",
                  'r') as file:
            data = json.load(file)
            # print(data)
            response = {"code": 200, "msg": "", "data": data}
            print(response)
        return jsonify(response)
    except IOError:
        print("Can't find the corresponding file")


if __name__ == "__main__":
    print("start")
    app.run(debug=True, port=5000)
