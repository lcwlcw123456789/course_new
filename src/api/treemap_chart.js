import { baseUrl, getData } from "@/utils/serve";

export const getTreemapChartData = (year) => {
  return getData({ url: baseUrl + `/treemap-chart/${year}` });
};
