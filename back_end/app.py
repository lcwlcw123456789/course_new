from flask import Flask, jsonify
from flask_cors import CORS
import json
import csv
import os

# print(os.path.dirname(__file__))
os.chdir(os.path.dirname(__file__))

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


@app.route("/data", methods=['GET'])
def getWholeData():
    data = None

    try:
        with open("./data/FoodImports.csv", 'r') as file:
            reader = csv.DictReader(file)
            rows = [row for row in reader]

        for row in rows:
            if "FoodValue" in row:
                try:
                    row["FoodValue"] = float(row["FoodValue"])
                except:
                    row["FoodValue"] = 0

            if "YearNum" in row:
                try:
                    row["YearNum"] = int(row["YearNum"])
                except:
                    row["YearNum"] = None

        response = {"code": 200, "msg": "", "data": rows}
        return jsonify(response)

    except Exception as e:
        print("Error reading CSV:", e)
        return jsonify({"code": 500, "msg": "Error reading CSV", "data": []})


if __name__ == "__main__":
    print("start")
    app.run(debug=True, port=5000)
