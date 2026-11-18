import type { Metadata } from "next";
import { HomeView } from "./home-view";

export const metadata: Metadata = {
  title: "Juhend",
};

export default function Home() {
  return <HomeView />;
}
