import { Pedometer } from "expo-sensors";
import { useEffect, useState } from "react";

export const usePedometer = () => {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState(false);
  const [currentSteps, setCurrentSteps] = useState(0);
  const [pastSteps, setPastSteps] = useState(0);

  useEffect(() => {
    checkAvailability();
    subscribeToPedometer();
    getPastSteps();
  }, []);

  const checkAvailability = async () => {
    const available = await Pedometer.isAvailableAsync();
    setIsPedometerAvailable(available);
  };

  const subscribeToPedometer = () => {
    const subscription = Pedometer.watchStepCount((result) => {
      setCurrentSteps(result.steps);
    });

    return () => subscription && subscription.remove();
  };

  const getPastSteps = async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 1); // Last 24 hours

    try {
      const result = await Pedometer.getStepCountAsync(start, end);
      if (result) {
        setPastSteps(result.steps);
      }
    } catch (error) {
      console.error("Error getting past steps:", error);
    }
  };

  const getTotalSteps = () => {
    return pastSteps + currentSteps;
  };

  return {
    isPedometerAvailable,
    currentSteps,
    pastSteps,
    totalSteps: getTotalSteps(),
  };
};
