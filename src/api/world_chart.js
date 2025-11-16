import { baseUrl, getData } from "@/utils/serve";

export const getWorldChartData = (year, category) => {
  return getData({ url: baseUrl + `/world-chart/${year}/${category}` });
};
