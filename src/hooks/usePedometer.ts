import { Pedometer } from "expo-sensors";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

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
    try {
      const available = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(available);
      if (!available) {
        console.log("Pedometer not available (likely running in simulator)");
      }
    } catch (error) {
      console.log("Pedometer check failed:", error);
      setIsPedometerAvailable(false);
    }
  };

  const subscribeToPedometer = () => {
    // Don't subscribe if we're on web or if pedometer is unavailable
    if (Platform.OS === "web") {
      return;
    }

    try {
      const subscription = Pedometer.watchStepCount((result) => {
        setCurrentSteps(result.steps);
      });

      return () => subscription && subscription.remove();
    } catch (error) {
      console.log("Error subscribing to pedometer:", error);
    }
  };

  const getPastSteps = async () => {
    // Don't try to get past steps on web or if unavailable
    if (Platform.OS === "web") {
      return;
    }

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 1); // Last 24 hours

    try {
      const available = await Pedometer.isAvailableAsync();
      if (!available) {
        console.log("Pedometer not available, skipping past steps query");
        return;
      }

      const result = await Pedometer.getStepCountAsync(start, end);
      if (result) {
        setPastSteps(result.steps);
      }
    } catch (error) {
      console.log("Error getting steps:", error);
      // Don't throw error, just continue with 0 steps
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
