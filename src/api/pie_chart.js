import { baseUrl, getData } from "@/utils/serve";

export const getPieChartData = (year) => {
  return getData({ url: baseUrl + `/pie-chart/${year}` });
};
