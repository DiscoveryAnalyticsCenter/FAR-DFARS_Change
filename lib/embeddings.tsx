import * as use from "@tensorflow-models/universal-sentence-encoder";
import { kmeans } from "ml-kmeans";
import * as tf from '@tensorflow/tfjs-node';  // TensorFlow.js Node backend

let model: any = null;

export async function loadModel() {
    if (!model) {
        model = await use.load();
        tf.setBackend('cpu')
        console.log("✅ USE Model loaded and cached!");
    }
    return model;
}

export async function getCommentEmbeddings(comments: string[]) {
  console.log(model)
  const m = await loadModel();
  const batchSize: number = 32;
  const embeddings = [];
  for (let i: number = 0; i < comments.length; i += batchSize) {
    const batch = comments.slice (i, i + batchSize);
    const batchEmbeddings = await model.embed(batch);
    embeddings.push(...batchEmbeddings.arraySync())
  }
  return embeddings;
}

export async function clusterComments(comments: string[], numClusters: number = 6) {
  const embeddings = await getCommentEmbeddings(comments);
  const clusters = kmeans(embeddings, numClusters, {});
  const groups = groupItemsByCluster(comments, clusters.clusters);
  return groups
}

function groupItemsByCluster(items: string[], clusterLabels: number[]) {
  const grouped : any = {};

  // Iterate over all items and group them based on their cluster label
  items.forEach((item, index) => {
      const clusterId = clusterLabels[index];

      if (!grouped[clusterId]) {
          grouped[clusterId] = [];
      }

      grouped[clusterId].push(item);
  });

  const groups = [];

  for (let i: number = 0; i < clusterLabels.length; i++) {
    groups.push(grouped[clusterLabels[i]])
  }

  return groups;
}