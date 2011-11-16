package org.apache.hadoop.mapred;

import static junit.framework.Assert.*;
import static org.easymock.EasyMock.*;

import java.io.IOException;
import java.util.Collection;
import java.util.List;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.mapred.AuditServerHttpClient.AuditServerResponse;
import org.apache.hadoop.mapreduce.server.jobtracker.TaskTracker;
import org.junit.Before;
import org.junit.Test;


public class AuditEnforcingTaskSchedulerWrapperTest {
	private static final String TEST_JAR_SHA1 = "849ee21fd67bc51fa6d149cd1c99c636bdc7364b";
	private static final String TEST_JAR_LOCATION = "src/test/data/test.jar";
	private static final String SECRET_SESSION_TOKEN = "SECRET_SESSION_TOKEN";
	private static final String ACTUAL_SCHEDULER_CLASS = "org.apache.hadoop.mapred.JobQueueTaskScheduler";
	
	private Configuration conf;
	
	@Before
	public void setup() {
		conf = new Configuration();
		conf.set("auditable.mapreduce.actualTaskScheduler", ACTUAL_SCHEDULER_CLASS);
		conf.set("auditable.mapreduce.sessionToken", SECRET_SESSION_TOKEN);
		conf.set("mapred.jar", TEST_JAR_LOCATION);
	}
	
	@Test (expected = IOException.class)
	public void shouldBlockJobsWithoutToken() throws IOException {
		conf = new Configuration();
		conf.set("auditable.mapreduce.actualTaskScheduler", ACTUAL_SCHEDULER_CLASS);
		conf.set("mapred.jar", TEST_JAR_LOCATION);
		AuditServerHttpClient clientMock = createMock(AuditServerHttpClient.class);
		
		AuditEnforcingTaskSchedulerWrapper subject = new AuditEnforcingTaskSchedulerWrapper(clientMock);
		subject.setConf(conf);
				
		subject.checkJobSubmission(new JobInProgress(new JobID("JTID", 100), new JobConf(conf), createMock(JobTracker.class)));
	}
	
	@Test
	public void shouldProduceTokenAndSha1AndJarName() throws IOException {
		AuditServerHttpClient clientMock = createMock(AuditServerHttpClient.class);
		
		AuditEnforcingTaskSchedulerWrapper subject = new AuditEnforcingTaskSchedulerWrapper(clientMock);
		subject.setConf(conf);
		
		expect(clientMock.challengeServer(
				eq(SECRET_SESSION_TOKEN), 
				eq("test.jar"), 
				eq(TEST_JAR_SHA1))).andReturn(AuditServerResponse.OK);
		replay(clientMock);
		
		subject.checkJobSubmission(new JobInProgress(new JobID("JTID", 100), new JobConf(conf), createMock(JobTracker.class)));
		verify(clientMock);
	}
	
	@Test(expected = IOException.class)
	public void shouldBlockNokJobs() throws IOException {
		AuditServerHttpClient clientMock = createMock(AuditServerHttpClient.class);
		
		AuditEnforcingTaskSchedulerWrapper subject = new AuditEnforcingTaskSchedulerWrapper(clientMock);
		subject.setConf(conf);
		
		expect(clientMock.challengeServer(
				anyObject(String.class), 
				anyObject(String.class), 
				anyObject(String.class))).andReturn(AuditServerResponse.NOK);
		replay(clientMock);
		
		subject.checkJobSubmission(new JobInProgress(new JobID("JTID", 100), new JobConf(conf), createMock(JobTracker.class)));
	}
	
	@Test
	public void shouldInstantiateActualSchedulerClass() {
		Configuration conf = new Configuration();
		conf.set("auditable.mapreduce.actualTaskScheduler", "org.apache.hadoop.mapred.AuditEnforcingTaskSchedulerWrapperTest$TestScheduler");
		
		AuditServerHttpClient clientMock = createMock(AuditServerHttpClient.class);
		
		assertFalse(TestScheduler.instantiated);
		AuditEnforcingTaskSchedulerWrapper subject = new AuditEnforcingTaskSchedulerWrapper(clientMock);
		subject.setConf(conf);
		assertTrue(TestScheduler.instantiated);
	}
	
	public static class TestScheduler extends TaskScheduler {
		public static boolean instantiated = false;
		
		public TestScheduler() {
			TestScheduler.instantiated = true;
		}
		
		@Override
		public List<Task> assignTasks(TaskTracker taskTracker) throws IOException {
			return null;
		}

		@Override
		public Collection<JobInProgress> getJobs(String queueName) {
			return null;
		}
	}
	
	@Test
	public void shouldRemoveSessionTokenFromConfiguration() throws IOException {
		AuditServerHttpClient clientMock = createMock(AuditServerHttpClient.class);
		
		AuditEnforcingTaskSchedulerWrapper subject = new AuditEnforcingTaskSchedulerWrapper(clientMock);
		subject.setConf(conf);
				
		JobConf jobConf = new JobConf(conf);
		subject.checkJobSubmission(new JobInProgress(new JobID("JTID", 100), jobConf, createMock(JobTracker.class)));
		
		assertEquals("", jobConf.get("auditable.mapreduce.sessionToken"));
	}
}
