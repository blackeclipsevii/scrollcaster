#pragma once
class DungeonBuilder
{
public:
	DungeonBuilder(int width, int height);
	void replaceHalls();
	void generateRoom();
	void clear(int, int);
	void print();
};

