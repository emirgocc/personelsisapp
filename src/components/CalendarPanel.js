import React from 'react';
import { Calendar } from 'react-native-calendars';

export default function CalendarPanel({ currentDate, markedDates, handleDayPress, handleMonthChange }) {
  return (
    <Calendar
      onDayPress={handleDayPress}
      markedDates={markedDates}
      markingType={'custom'}
      current={currentDate.toISOString().slice(0, 10)}
      minDate={new Date().toISOString().slice(0, 10)}
      onMonthChange={handleMonthChange}
      theme={{
        calendarBackground: 'transparent',
        todayTextColor: '#888',
        dayTextColor: '#222',
        textDisabledColor: '#bdbdbd',
        arrowColor: '#888',
        monthTextColor: '#111',
        textMonthFontSize: 18,
        textMonthFontWeight: 'bold',
        textDayHeaderFontSize: 14,
        textDayHeaderFontWeight: '500',
        textDayFontSize: 16,
        textDayFontWeight: '400',
      }}
      style={{ margin: 16, marginTop: 24 }}
    />
  );
}
