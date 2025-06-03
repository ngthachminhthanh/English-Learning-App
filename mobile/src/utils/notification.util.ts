import * as Notifications from 'expo-notifications';

export async function scheduleStudyReminder(title: string, body: string) {

    const { status } = await Notifications.requestPermissionsAsync();

    console.log(`Notification permission status: ${status}`);
    
    if (status !== 'granted') {
        console.warn('Notification permissions not granted!');
        return;
    }

    console.log(`Scheduling notification with title: "${title}" and body: "${body}"`);
    

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(17, 29, 0, 0); // 5:20 PM

    if (scheduledTime < now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: scheduledTime.getHours(),
            minute: scheduledTime.getMinutes(),
        },
    });

    console.log("Notification scheduled successfully!");
    
}