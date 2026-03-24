export const parseFlow = (nodes, edges) => {
  const flow = {};
  nodes.forEach(node => {
    flow[node.id] = {
      message: node.data.label,
      type: node.type,
      buttons: node.data.buttons?.map(button => ({
        id: button.id,
        title: button.label,
        next: edges.find(edge => edge.sourceHandle === button.id)?.target || null,
      })) || [],
    };
  });
  return flow;
};
